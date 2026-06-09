import { Request, Response, NextFunction } from 'express';
import { MessagingUseCase, MessagingError } from '../../../application/use-cases/MessagingUseCase';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';

export class MessageController {
  constructor(private useCase: MessagingUseCase) {}

  listConversations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const conversations = await this.useCase.listConversations(userId);
      res.json({ success: true, data: conversations });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  startConversation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const conversation = await this.useCase.startConversation(userId, req.body.userId);
      res.status(201).json({ success: true, data: conversation });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  getMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
      const result = await this.useCase.getMessages(userId, req.params.id as string, {
        page,
        limit,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  sendMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const message = await this.useCase.sendMessage(
        userId,
        req.params.id as string,
        req.body.content,
      );
      res.status(201).json({ success: true, data: message });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  unreadCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const count = await this.useCase.totalUnread(userId);
      res.json({ success: true, data: { count } });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  private mapError(err: unknown): AppError | Error {
    if (err instanceof MessagingError) return new AppError(err.statusCode, err.message);
    if (err instanceof AppError) return err;
    return err as Error;
  }
}
