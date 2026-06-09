import crypto from 'crypto';
import { UserStatus } from '@ecommerce/shared';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IHashService } from '../../domain/services/IHashService';
import { ITokenService } from '../../domain/services/ITokenService';
import { IEmailService } from '../../domain/services/IEmailService';
import { UserEntity } from '../../domain/entities/User';
import {
  RegisterDto,
  LoginDto,
  AuthResultDto,
  ChangePasswordDto,
  ResetPasswordDto,
} from '../dtos/AuthDtos';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export interface AuthUseCaseConfig {
  clientUrl: string;
}

export class AuthUseCase {
  constructor(
    private userRepo: IUserRepository,
    private hashService: IHashService,
    private tokenService: ITokenService,
    private emailService: IEmailService,
    private config: AuthUseCaseConfig,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResultDto> {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      throw new AuthError(409, 'An account with this email already exists');
    }

    const hashedPassword = await this.hashService.hash(dto.password);

    const user = await this.userRepo.create({
      email,
      password: hashedPassword,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
    });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
    await this.userRepo.setEmailVerificationToken(user.id, verificationToken, expires);

    const verificationUrl = `${this.config.clientUrl}/verify-email?token=${verificationToken}`;
    this.fireAndForget(
      this.emailService.sendWelcome(user.email, user.firstName, verificationUrl),
      'sendWelcome',
    );

    const tokens = this.tokenService.generateTokens({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    return this.buildAuthResult(user, tokens.accessToken, tokens.refreshToken);
  }

  async login(dto: LoginDto): Promise<AuthResultDto> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new AuthError(401, 'Invalid email or password');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new AuthError(403, 'Your account has been suspended');
    }

    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      const minutes = Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / 60000);
      throw new AuthError(
        423,
        `Account temporarily locked. Try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
      );
    }

    const valid = await this.hashService.compare(dto.password, user.password);
    if (!valid) {
      const attempts = await this.userRepo.incrementFailedLoginAttempts(user.id);
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        await this.userRepo.lockAccount(user.id, lockUntil);
        throw new AuthError(423, 'Too many failed attempts. Account locked for 15 minutes.');
      }
      throw new AuthError(401, 'Invalid email or password');
    }

    await this.userRepo.resetFailedLoginAttempts(user.id);
    await this.userRepo.updateLastLogin(user.id);

    const tokens = this.tokenService.generateTokens({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    return this.buildAuthResult(user, tokens.accessToken, tokens.refreshToken);
  }

  async refresh(refreshToken: string): Promise<AuthResultDto> {
    const blacklisted = await this.tokenService.isRefreshTokenBlacklisted(refreshToken);
    if (blacklisted) {
      throw new AuthError(401, 'Invalid token');
    }

    let payload;
    try {
      payload = this.tokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new AuthError(401, 'Invalid or expired token');
    }

    await this.tokenService.blacklistRefreshToken(refreshToken);

    const user = await this.userRepo.findById(payload.userId);
    if (!user) {
      throw new AuthError(401, 'User not found');
    }

    const tokens = this.tokenService.generateTokens({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    return this.buildAuthResult(user, tokens.accessToken, tokens.refreshToken);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokenService.blacklistRefreshToken(refreshToken);
  }

  async changePassword(dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepo.findById(dto.userId);
    if (!user) {
      throw new AuthError(404, 'User not found');
    }

    const valid = await this.hashService.compare(dto.currentPassword, user.password);
    if (!valid) {
      throw new AuthError(400, 'Current password is incorrect');
    }

    const hashed = await this.hashService.hash(dto.newPassword);
    await this.userRepo.updatePassword(user.id, hashed);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepo.findByEmail(email.toLowerCase().trim());
    if (!user) {
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await this.userRepo.setResetToken(user.email, token, expires);

    const resetUrl = `${this.config.clientUrl}/reset-password?token=${token}`;
    this.fireAndForget(
      this.emailService.sendPasswordReset(user.email, user.firstName, resetUrl),
      'sendPasswordReset',
    );
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const user = await this.userRepo.findByResetToken(dto.token);
    if (!user) {
      throw new AuthError(400, 'Invalid or expired reset token');
    }

    if (dto.newPassword.length < 8) {
      throw new AuthError(400, 'Password must be at least 8 characters');
    }

    const hashed = await this.hashService.hash(dto.newPassword);
    await this.userRepo.updatePassword(user.id, hashed);
    await this.userRepo.clearResetToken(user.id);
    await this.userRepo.resetFailedLoginAttempts(user.id);
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.userRepo.findByEmailVerificationToken(token);
    if (!user) {
      throw new AuthError(400, 'Invalid or expired verification token');
    }
    if (user.emailVerified) {
      return;
    }
    await this.userRepo.markEmailVerified(user.id);
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.userRepo.findByEmail(email.toLowerCase().trim());
    if (!user || user.emailVerified) {
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
    await this.userRepo.setEmailVerificationToken(user.id, token, expires);

    const verificationUrl = `${this.config.clientUrl}/verify-email?token=${token}`;
    this.fireAndForget(
      this.emailService.sendEmailVerification(user.email, user.firstName, verificationUrl),
      'sendEmailVerification',
    );
  }

  async getMe(userId: string): Promise<AuthResultDto['user']> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AuthError(404, 'User not found');
    }
    return this.toUserDto(user);
  }

  private buildAuthResult(
    user: UserEntity,
    accessToken: string,
    refreshToken: string,
  ): AuthResultDto {
    return {
      user: this.toUserDto(user),
      accessToken,
      refreshToken,
    };
  }

  private toUserDto(user: UserEntity): AuthResultDto['user'] {
    return {
      _id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      phone: user.phone,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt?.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private fireAndForget(promise: Promise<unknown>, label: string): void {
    promise.catch((err) => {
      console.error(`[AuthUseCase] ${label} failed:`, err);
    });
  }
}

export class AuthError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}
