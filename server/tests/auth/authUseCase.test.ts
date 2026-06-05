import { UserRole, UserStatus } from '@ecommerce/shared';
import { AuthUseCase, AuthError } from '../../src/application/use-cases/AuthUseCase';
import { IUserRepository } from '../../src/domain/repositories/IUserRepository';
import { IHashService } from '../../src/domain/services/IHashService';
import { ITokenService } from '../../src/domain/services/ITokenService';
import { IEmailService } from '../../src/domain/services/IEmailService';
import { UserEntity } from '../../src/domain/entities/User';

function buildUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return {
    id: 'user-1',
    email: 'alice@example.com',
    password: 'hashed-password',
    firstName: 'Alice',
    lastName: 'Doe',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    addresses: [],
    preferences: {
      language: 'en',
      currency: 'EUR',
      notifications: {
        email: true,
        push: false,
        orderUpdates: true,
        promotions: false,
        priceDrops: false,
      },
    },
    emailVerified: false,
    failedLoginAttempts: 0,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function makeUserRepo(initial?: UserEntity): IUserRepository {
  let user = initial ?? null;
  const repo: IUserRepository = {
    findById: jest.fn(async (id: string) => (user && user.id === id ? user : null)),
    findByEmail: jest.fn(async (email: string) =>
      user && user.email === email.toLowerCase() ? user : null,
    ),
    create: jest.fn(async (data) => {
      user = buildUser({
        id: 'user-new',
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      return user;
    }),
    updateById: jest.fn(async () => user),
    updatePassword: jest.fn(async () => undefined),
    updateLastLogin: jest.fn(async () => undefined),
    findMany: jest.fn(async () => ({ users: [], total: 0 })),
    deleteById: jest.fn(async () => undefined),
    setResetToken: jest.fn(async () => true),
    findByResetToken: jest.fn(async () => null),
    clearResetToken: jest.fn(async () => undefined),
    setEmailVerificationToken: jest.fn(async () => undefined),
    findByEmailVerificationToken: jest.fn(async () => null),
    markEmailVerified: jest.fn(async () => undefined),
    incrementFailedLoginAttempts: jest.fn(async () => {
      if (user) user.failedLoginAttempts += 1;
      return user?.failedLoginAttempts ?? 0;
    }),
    lockAccount: jest.fn(async (_id, until) => {
      if (user) user.accountLockedUntil = until;
    }),
    resetFailedLoginAttempts: jest.fn(async () => {
      if (user) {
        user.failedLoginAttempts = 0;
        user.accountLockedUntil = undefined;
      }
    }),
    addAddress: jest.fn(async () => user),
    updateAddress: jest.fn(async () => user),
    deleteAddress: jest.fn(async () => user),
    updatePreferences: jest.fn(async () => user),
  };
  return repo;
}

function makeHashService(comparesEqual = true): IHashService {
  return {
    hash: jest.fn(async (raw: string) => `hashed:${raw}`),
    compare: jest.fn(async () => comparesEqual),
  };
}

function makeTokenService(): ITokenService {
  return {
    generateTokens: jest.fn(() => ({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    })),
    verifyAccessToken: jest.fn(() => ({
      userId: 'user-1',
      role: UserRole.USER,
      email: 'alice@example.com',
    })),
    verifyRefreshToken: jest.fn(() => ({
      userId: 'user-1',
      role: UserRole.USER,
      email: 'alice@example.com',
    })),
    blacklistRefreshToken: jest.fn(async () => undefined),
    isRefreshTokenBlacklisted: jest.fn(async () => false),
  };
}

function makeEmailService(): IEmailService {
  return {
    sendPasswordReset: jest.fn(async () => undefined),
    sendWelcome: jest.fn(async () => undefined),
    sendEmailVerification: jest.fn(async () => undefined),
    sendOrderConfirmation: jest.fn(async () => undefined),
  };
}

const fixedConfig = { clientUrl: 'http://localhost:3000' };

const flushMicrotasks = () => new Promise((r) => setImmediate(r));

describe('AuthUseCase', () => {
  describe('register', () => {
    it('creates user, generates tokens, and sends welcome email', async () => {
      const repo = makeUserRepo();
      const hash = makeHashService();
      const tokens = makeTokenService();
      const email = makeEmailService();
      const useCase = new AuthUseCase(repo, hash, tokens, email, fixedConfig);

      const result = await useCase.register({
        email: 'BOB@example.com',
        password: 'Password123',
        firstName: ' Bob ',
        lastName: ' Smith ',
      });

      expect(hash.hash).toHaveBeenCalledWith('Password123');
      expect(repo.create).toHaveBeenCalledWith({
        email: 'bob@example.com',
        password: 'hashed:Password123',
        firstName: 'Bob',
        lastName: 'Smith',
      });
      expect(repo.setEmailVerificationToken).toHaveBeenCalled();
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user.email).toBe('bob@example.com');

      await flushMicrotasks();
      expect(email.sendWelcome).toHaveBeenCalledWith(
        'bob@example.com',
        'Bob',
        expect.stringContaining('http://localhost:3000/verify-email?token='),
      );
    });

    it('rejects duplicate emails with 409', async () => {
      const repo = makeUserRepo(buildUser({ email: 'taken@example.com' }));
      const useCase = new AuthUseCase(
        repo,
        makeHashService(),
        makeTokenService(),
        makeEmailService(),
        fixedConfig,
      );

      await expect(
        useCase.register({
          email: 'taken@example.com',
          password: 'Password123',
          firstName: 'X',
          lastName: 'Y',
        }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('login', () => {
    it('authenticates valid credentials and resets failed attempts', async () => {
      const user = buildUser({ failedLoginAttempts: 2 });
      const repo = makeUserRepo(user);
      const useCase = new AuthUseCase(
        repo,
        makeHashService(true),
        makeTokenService(),
        makeEmailService(),
        fixedConfig,
      );

      const result = await useCase.login({
        email: 'alice@example.com',
        password: 'Password123',
      });

      expect(result.user.email).toBe('alice@example.com');
      expect(repo.resetFailedLoginAttempts).toHaveBeenCalledWith('user-1');
      expect(repo.updateLastLogin).toHaveBeenCalledWith('user-1');
    });

    it('rejects unknown email with 401', async () => {
      const repo = makeUserRepo();
      const useCase = new AuthUseCase(
        repo,
        makeHashService(),
        makeTokenService(),
        makeEmailService(),
        fixedConfig,
      );
      await expect(
        useCase.login({ email: 'missing@example.com', password: 'whatever' }),
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('rejects suspended account with 403', async () => {
      const repo = makeUserRepo(buildUser({ status: UserStatus.SUSPENDED }));
      const useCase = new AuthUseCase(
        repo,
        makeHashService(true),
        makeTokenService(),
        makeEmailService(),
        fixedConfig,
      );
      await expect(
        useCase.login({ email: 'alice@example.com', password: 'x' }),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('rejects login with 423 when account is locked', async () => {
      const future = new Date(Date.now() + 5 * 60 * 1000);
      const repo = makeUserRepo(buildUser({ accountLockedUntil: future }));
      const useCase = new AuthUseCase(
        repo,
        makeHashService(true),
        makeTokenService(),
        makeEmailService(),
        fixedConfig,
      );
      await expect(
        useCase.login({ email: 'alice@example.com', password: 'Password123' }),
      ).rejects.toMatchObject({ statusCode: 423 });
    });

    it('locks the account on the 5th failed login attempt', async () => {
      const repo = makeUserRepo(buildUser({ failedLoginAttempts: 4 }));
      const useCase = new AuthUseCase(
        repo,
        makeHashService(false),
        makeTokenService(),
        makeEmailService(),
        fixedConfig,
      );

      await expect(
        useCase.login({ email: 'alice@example.com', password: 'wrong' }),
      ).rejects.toMatchObject({ statusCode: 423 });

      expect(repo.lockAccount).toHaveBeenCalledWith('user-1', expect.any(Date));
    });

    it('increments failed attempts without locking below threshold', async () => {
      const repo = makeUserRepo(buildUser({ failedLoginAttempts: 1 }));
      const useCase = new AuthUseCase(
        repo,
        makeHashService(false),
        makeTokenService(),
        makeEmailService(),
        fixedConfig,
      );

      await expect(
        useCase.login({ email: 'alice@example.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(AuthError);

      expect(repo.incrementFailedLoginAttempts).toHaveBeenCalled();
      expect(repo.lockAccount).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('rotates tokens and blacklists the old refresh token', async () => {
      const repo = makeUserRepo(buildUser());
      const tokens = makeTokenService();
      const useCase = new AuthUseCase(
        repo,
        makeHashService(),
        tokens,
        makeEmailService(),
        fixedConfig,
      );

      await useCase.refresh('old-refresh-token');

      expect(tokens.blacklistRefreshToken).toHaveBeenCalledWith('old-refresh-token');
      expect(tokens.generateTokens).toHaveBeenCalled();
    });

    it('rejects already-blacklisted refresh tokens', async () => {
      const tokens = makeTokenService();
      (tokens.isRefreshTokenBlacklisted as jest.Mock).mockResolvedValue(true);
      const useCase = new AuthUseCase(
        makeUserRepo(buildUser()),
        makeHashService(),
        tokens,
        makeEmailService(),
        fixedConfig,
      );
      await expect(useCase.refresh('bad')).rejects.toMatchObject({ statusCode: 401 });
    });

    it('rejects when JWT verification throws', async () => {
      const tokens = makeTokenService();
      (tokens.verifyRefreshToken as jest.Mock).mockImplementation(() => {
        throw new Error('expired');
      });
      const useCase = new AuthUseCase(
        makeUserRepo(buildUser()),
        makeHashService(),
        tokens,
        makeEmailService(),
        fixedConfig,
      );
      await expect(useCase.refresh('expired')).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe('forgotPassword', () => {
    it('emits a reset email and persists the token when user exists', async () => {
      const repo = makeUserRepo(buildUser());
      const email = makeEmailService();
      const useCase = new AuthUseCase(
        repo,
        makeHashService(),
        makeTokenService(),
        email,
        fixedConfig,
      );

      await useCase.forgotPassword('alice@example.com');

      expect(repo.setResetToken).toHaveBeenCalled();
      await flushMicrotasks();
      expect(email.sendPasswordReset).toHaveBeenCalledWith(
        'alice@example.com',
        'Alice',
        expect.stringContaining('http://localhost:3000/reset-password?token='),
      );
    });

    it('silently no-ops for unknown emails (no enumeration)', async () => {
      const repo = makeUserRepo();
      const email = makeEmailService();
      const useCase = new AuthUseCase(
        repo,
        makeHashService(),
        makeTokenService(),
        email,
        fixedConfig,
      );

      await useCase.forgotPassword('missing@example.com');

      expect(repo.setResetToken).not.toHaveBeenCalled();
      expect(email.sendPasswordReset).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('hashes the new password, clears the token, and resets lockout', async () => {
      const repo = makeUserRepo(buildUser());
      (repo.findByResetToken as jest.Mock).mockResolvedValue(buildUser());
      const useCase = new AuthUseCase(
        repo,
        makeHashService(),
        makeTokenService(),
        makeEmailService(),
        fixedConfig,
      );

      await useCase.resetPassword({ token: 'abc', newPassword: 'NewPassword1' });

      expect(repo.updatePassword).toHaveBeenCalledWith('user-1', 'hashed:NewPassword1');
      expect(repo.clearResetToken).toHaveBeenCalledWith('user-1');
      expect(repo.resetFailedLoginAttempts).toHaveBeenCalledWith('user-1');
    });

    it('rejects invalid tokens with 400', async () => {
      const repo = makeUserRepo();
      (repo.findByResetToken as jest.Mock).mockResolvedValue(null);
      const useCase = new AuthUseCase(
        repo,
        makeHashService(),
        makeTokenService(),
        makeEmailService(),
        fixedConfig,
      );

      await expect(
        useCase.resetPassword({ token: 'bad', newPassword: 'NewPassword1' }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('verifyEmail', () => {
    it('marks email as verified for a valid token', async () => {
      const repo = makeUserRepo();
      (repo.findByEmailVerificationToken as jest.Mock).mockResolvedValue(
        buildUser({ emailVerified: false }),
      );
      const useCase = new AuthUseCase(
        repo,
        makeHashService(),
        makeTokenService(),
        makeEmailService(),
        fixedConfig,
      );

      await useCase.verifyEmail('valid-token');

      expect(repo.markEmailVerified).toHaveBeenCalledWith('user-1');
    });

    it('rejects invalid tokens with 400', async () => {
      const repo = makeUserRepo();
      (repo.findByEmailVerificationToken as jest.Mock).mockResolvedValue(null);
      const useCase = new AuthUseCase(
        repo,
        makeHashService(),
        makeTokenService(),
        makeEmailService(),
        fixedConfig,
      );
      await expect(useCase.verifyEmail('bad')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('is a no-op for already-verified emails', async () => {
      const repo = makeUserRepo();
      (repo.findByEmailVerificationToken as jest.Mock).mockResolvedValue(
        buildUser({ emailVerified: true }),
      );
      const useCase = new AuthUseCase(
        repo,
        makeHashService(),
        makeTokenService(),
        makeEmailService(),
        fixedConfig,
      );

      await useCase.verifyEmail('already-used');

      expect(repo.markEmailVerified).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('updates password when current password is correct', async () => {
      const repo = makeUserRepo(buildUser());
      const useCase = new AuthUseCase(
        repo,
        makeHashService(true),
        makeTokenService(),
        makeEmailService(),
        fixedConfig,
      );

      await useCase.changePassword({
        userId: 'user-1',
        currentPassword: 'old',
        newPassword: 'NewPass1',
      });

      expect(repo.updatePassword).toHaveBeenCalledWith('user-1', 'hashed:NewPass1');
    });

    it('rejects with 400 when current password is wrong', async () => {
      const repo = makeUserRepo(buildUser());
      const useCase = new AuthUseCase(
        repo,
        makeHashService(false),
        makeTokenService(),
        makeEmailService(),
        fixedConfig,
      );
      await expect(
        useCase.changePassword({
          userId: 'user-1',
          currentPassword: 'wrong',
          newPassword: 'NewPass1',
        }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });
});
