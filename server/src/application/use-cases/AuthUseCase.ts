import { UserRole, UserStatus } from '@ecommerce/shared';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IHashService } from '../../domain/services/IHashService';
import { ITokenService } from '../../domain/services/ITokenService';
import { UserEntity } from '../../domain/entities/User';
import { RegisterDto, LoginDto, AuthResultDto, ChangePasswordDto } from '../dtos/AuthDtos';

export class AuthUseCase {
  constructor(
    private userRepo: IUserRepository,
    private hashService: IHashService,
    private tokenService: ITokenService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResultDto> {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      throw new AuthError(409, 'Un compte avec cet email existe déjà');
    }

    const hashedPassword = await this.hashService.hash(dto.password);

    const user = await this.userRepo.create({
      email: dto.email.toLowerCase().trim(),
      password: hashedPassword,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
    });

    const tokens = this.tokenService.generateTokens({
      userId: user.id,
      role: user.role,
    });

    return this.buildAuthResult(user, tokens.accessToken, tokens.refreshToken);
  }

  async login(dto: LoginDto): Promise<AuthResultDto> {
    const user = await this.userRepo.findByEmail(dto.email.toLowerCase().trim());
    if (!user) {
      throw new AuthError(401, 'Email ou mot de passe incorrect');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new AuthError(403, 'Votre compte a été suspendu');
    }

    const valid = await this.hashService.compare(dto.password, user.password);
    if (!valid) {
      throw new AuthError(401, 'Email ou mot de passe incorrect');
    }

    await this.userRepo.updateLastLogin(user.id);

    const tokens = this.tokenService.generateTokens({
      userId: user.id,
      role: user.role,
    });

    return this.buildAuthResult(user, tokens.accessToken, tokens.refreshToken);
  }

  async refresh(refreshToken: string): Promise<AuthResultDto> {
    const blacklisted = await this.tokenService.isRefreshTokenBlacklisted(refreshToken);
    if (blacklisted) {
      throw new AuthError(401, 'Token invalide');
    }

    let payload;
    try {
      payload = this.tokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new AuthError(401, 'Token invalide ou expiré');
    }

    await this.tokenService.blacklistRefreshToken(refreshToken);

    const user = await this.userRepo.findById(payload.userId);
    if (!user) {
      throw new AuthError(401, 'Utilisateur introuvable');
    }

    const tokens = this.tokenService.generateTokens({
      userId: user.id,
      role: user.role,
    });

    return this.buildAuthResult(user, tokens.accessToken, tokens.refreshToken);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokenService.blacklistRefreshToken(refreshToken);
  }

  async changePassword(dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepo.findById(dto.userId);
    if (!user) {
      throw new AuthError(404, 'Utilisateur introuvable');
    }

    const valid = await this.hashService.compare(dto.currentPassword, user.password);
    if (!valid) {
      throw new AuthError(400, 'Mot de passe actuel incorrect');
    }

    const hashed = await this.hashService.hash(dto.newPassword);
    await this.userRepo.updatePassword(user.id, hashed);
  }

  async getMe(userId: string): Promise<AuthResultDto['user']> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AuthError(404, 'Utilisateur introuvable');
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
      lastLoginAt: user.lastLoginAt?.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
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
