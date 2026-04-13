import { Request, Response, NextFunction } from 'express';
import { ProfileUseCase, ProfileError } from '../../../application/use-cases/ProfileUseCase';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';

export class UserController {
  constructor(private profileUseCase: ProfileUseCase) {}

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const profile = await this.profileUseCase.getProfile(userId);
      res.json({ success: true, data: profile });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const { firstName, lastName, phone, avatar } = req.body;

      const profile = await this.profileUseCase.updateProfile(userId, {
        firstName,
        lastName,
        phone,
        avatar,
      });

      res.json({ success: true, data: profile });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  private mapError(err: unknown): AppError | Error {
    if (err instanceof ProfileError) {
      return new AppError(err.statusCode, err.message);
    }
    if (err instanceof AppError) {
      return err;
    }
    return err as Error;
  }
}
