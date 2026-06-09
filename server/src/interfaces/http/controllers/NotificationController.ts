import { Request, Response, NextFunction } from 'express';
import { NotificationUseCase } from '../../../application/use-cases/NotificationUseCase';
import { AuthRequest } from '../middlewares/auth';

export class NotificationController {
  constructor(private useCase: NotificationUseCase) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
      const unreadOnly = req.query.unreadOnly === 'true';
      const result = await this.useCase.list(userId, { page, limit, unreadOnly });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  unreadCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const count = await this.useCase.unreadCount(userId);
      res.json({ success: true, data: { count } });
    } catch (err) {
      next(err);
    }
  };

  markRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const notification = await this.useCase.markRead(userId, req.params.id as string);
      res.json({ success: true, data: notification });
    } catch (err) {
      next(err);
    }
  };

  markAllRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      await this.useCase.markAllRead(userId);
      res.json({ success: true, message: 'Toutes les notifications ont été marquées comme lues' });
    } catch (err) {
      next(err);
    }
  };
}
