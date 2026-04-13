import jwt from 'jsonwebtoken';
import { ITokenService, TokenPayload, TokenPair } from '../../domain/services/ITokenService';
import { config } from '../../config';
import { getRedisClient } from '../cache/redis';

const REFRESH_TOKEN_PREFIX = 'bl:rt:';

export class TokenService implements ITokenService {
  generateTokens(payload: TokenPayload): TokenPair {
    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): TokenPayload {
    const decoded = jwt.verify(token, config.jwt.secret) as jwt.JwtPayload & TokenPayload;
    return { userId: decoded.userId, role: decoded.role };
  }

  verifyRefreshToken(token: string): TokenPayload {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as jwt.JwtPayload & TokenPayload;
    return { userId: decoded.userId, role: decoded.role };
  }

  async blacklistRefreshToken(token: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    try {
      const decoded = jwt.decode(token) as jwt.JwtPayload | null;
      const ttl = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 7 * 24 * 60 * 60;
      if (ttl > 0) {
        await redis.setex(`${REFRESH_TOKEN_PREFIX}${token}`, ttl, '1');
      }
    } catch {
      // Token already expired, no need to blacklist
    }
  }

  async isRefreshTokenBlacklisted(token: string): Promise<boolean> {
    const redis = getRedisClient();
    if (!redis) return false;

    try {
      const result = await redis.get(`${REFRESH_TOKEN_PREFIX}${token}`);
      return result !== null;
    } catch {
      return false;
    }
  }
}
