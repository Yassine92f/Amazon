import { Request, Response, NextFunction } from 'express';
import { ReviewUseCase, ReviewError } from '../../../application/use-cases/ReviewUseCase';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';

export class BuyerReviewController {
  constructor(private useCase: ReviewUseCase) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const review = await this.useCase.createReview(userId, req.body);
      res.status(201).json({ success: true, data: review });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  // Product ids the user has already reviewed for a given order.
  mine = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const orderId = req.query.orderId as string;
      const productIds = orderId ? await this.useCase.listReviewedProductIds(userId, orderId) : [];
      res.json({ success: true, data: { productIds } });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  private mapError(err: unknown): AppError | Error {
    if (err instanceof ReviewError) return new AppError(err.statusCode, err.message);
    if (err instanceof AppError) return err;
    return err as Error;
  }
}
