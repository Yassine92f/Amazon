export interface TokenPayload {
  userId: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ITokenService {
  generateTokens(payload: TokenPayload): TokenPair;
  verifyAccessToken(token: string): TokenPayload;
  verifyRefreshToken(token: string): TokenPayload;
  blacklistRefreshToken(token: string): Promise<void>;
  isRefreshTokenBlacklisted(token: string): Promise<boolean>;
}
