import { Request, Response, NextFunction } from 'express';
import { ReviewBrowseUseCase } from '../../../application/use-cases/ReviewBrowseUseCase';
import { AppError } from '../middlewares/errorHandler';

export class ReviewController {
  constructor(private reviewUseCase: ReviewBrowseUseCase) {}

  listForProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productId = req.params.productId as string;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      const sortBy = req.query.sortBy === 'rating' ? 'rating' : 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
      const minRating = req.query.minRating ? Number(req.query.minRating) : undefined;

      const result = await this.reviewUseCase.listForProduct({
        productId,
        page,
        limit,
        sortBy,
        sortOrder,
        minRating,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err instanceof AppError ? err : (err as Error));
    }
  };
}
