import { Request, Response, NextFunction } from 'express';
import { AuthUseCase, AuthError } from '../../../application/use-cases/AuthUseCase';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';

export class AuthController {
  constructor(private authUseCase: AuthUseCase) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authUseCase.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authUseCase.login(req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authUseCase.refresh(req.body.refreshToken);
      res.json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body.refreshToken) {
        await this.authUseCase.logout(req.body.refreshToken);
      }
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      next(this.mapError(err));
    }
  };

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
