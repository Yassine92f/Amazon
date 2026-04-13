import { Request, Response, NextFunction } from 'express';
import { AuthUseCase, AuthError } from '../../../application/use-cases/AuthUseCase';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';

export class AuthController {
  constructor(private authUseCase: AuthUseCase) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password || !firstName || !lastName) {
        throw new AppError(400, 'Tous les champs sont requis');
      }
      if (password.length < 8) {
        throw new AppError(400, 'Le mot de passe doit contenir au moins 8 caractères');
      }

      const result = await this.authUseCase.register({ email, password, firstName, lastName });

      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError(400, 'Email et mot de passe requis');
      }

      const result = await this.authUseCase.login({ email, password });

      res.json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new AppError(400, 'Refresh token requis');
      }

      const result = await this.authUseCase.refresh(refreshToken);

      res.json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await this.authUseCase.logout(refreshToken);
      }
      res.json({ success: true, message: 'Déconnexion réussie' });
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
      const { email } = req.body;
      if (!email) {
        throw new AppError(400, 'Email requis');
      }

      await this.authUseCase.forgotPassword(email);

      res.json({
        success: true,
        message: 'Si un compte existe avec cet email, un lien de reinitialisation a ete envoye',
      });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        throw new AppError(400, 'Token et nouveau mot de passe requis');
      }
      if (newPassword.length < 8) {
        throw new AppError(400, 'Le mot de passe doit contenir au moins 8 caracteres');
      }

      await this.authUseCase.resetPassword({ token, newPassword });

      res.json({ success: true, message: 'Mot de passe reinitialise avec succes' });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new AppError(400, 'Les deux mots de passe sont requis');
      }
      if (newPassword.length < 8) {
        throw new AppError(400, 'Le nouveau mot de passe doit contenir au moins 8 caractères');
      }

      await this.authUseCase.changePassword({ userId, currentPassword, newPassword });

      res.json({ success: true, message: 'Mot de passe modifié' });
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
