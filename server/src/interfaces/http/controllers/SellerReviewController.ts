import { Request, Response, NextFunction } from 'express';
import {
  SellerReviewUseCase,
  SellerReviewError,
} from '../../../application/use-cases/SellerReviewUseCase';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../middlewares/errorHandler';

export class SellerReviewController {
  constructor(private useCase: SellerReviewUseCase) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
      const onlyUnanswered = req.query.onlyUnanswered === 'true';
      const result = await this.useCase.listForSeller({ userId, page, limit, onlyUnanswered });
      res.json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  respond = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const reviewId = req.params.reviewId as string;
      const { comment } = req.body as { comment: string };
      const review = await this.useCase.respond(userId, reviewId, comment);
      res.json({ success: true, data: review });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  private mapError(err: unknown): AppError | Error {
    if (err instanceof SellerReviewError) return new AppError(err.statusCode, err.message);
    if (err instanceof AppError) return err;
    return err as Error;
  }
}
