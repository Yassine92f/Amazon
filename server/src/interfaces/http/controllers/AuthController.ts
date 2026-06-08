import { Request, Response, NextFunction, CookieOptions } from 'express';
import { AuthUseCase, AuthError } from '../../../application/use-cases/AuthUseCase';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';
import { config } from '../../../config';

const REFRESH_COOKIE = 'refreshToken';
// 7 days, matching the refresh token TTL.
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

/**
 * Cookie holding the refresh token. httpOnly keeps it out of reach of JS (so an
 * XSS payload cannot exfiltrate it), the narrow path means it is only sent to
 * the auth endpoints that need it, and `secure` is enforced in production
 * (HTTPS only). SameSite=strict blocks it from cross-site requests (CSRF).
 */
function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: REFRESH_COOKIE_MAX_AGE,
  };
}

export class AuthController {
  constructor(private authUseCase: AuthUseCase) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authUseCase.register(req.body);
      this.setRefreshCookie(res, result.refreshToken);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authUseCase.login(req.body);
      this.setRefreshCookie(res, result.refreshToken);
      res.json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = this.readRefreshToken(req);
      if (!token) {
        throw new AppError(401, 'Refresh token is required');
      }
      const result = await this.authUseCase.refresh(token);
      this.setRefreshCookie(res, result.refreshToken);
      res.json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = this.readRefreshToken(req);
      if (token) {
        await this.authUseCase.logout(token);
      }
      this.clearRefreshCookie(res);
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  /** Prefer the httpOnly cookie, fall back to the request body (legacy clients). */
  private readRefreshToken(req: Request): string | undefined {
    return req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE, token, refreshCookieOptions());
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined });
  }

  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const user = await this.authUseCase.getMe(userId);
      res.json({ success: true, data: user });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.authUseCase.forgotPassword(req.body.email);
      res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent',
      });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.authUseCase.resetPassword(req.body);
      res.json({ success: true, message: 'Password reset successfully' });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const { currentPassword, newPassword } = req.body;
      await this.authUseCase.changePassword({ userId, currentPassword, newPassword });
      res.json({ success: true, message: 'Password updated' });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.authUseCase.verifyEmail(req.body.token);
      res.json({ success: true, message: 'Email verified' });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  resendVerification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.authUseCase.resendVerificationEmail(req.body.email);
      res.json({
        success: true,
        message: 'If a matching unverified account exists, a verification email has been sent',
      });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  private mapError(err: unknown): AppError | Error {
    if (err instanceof AuthError) {
      return new AppError(err.statusCode, err.message);
    }
    if (err instanceof AppError) {
      return err;
    }
    return err as Error;
  }
}
