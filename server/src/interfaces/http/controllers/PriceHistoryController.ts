import { Request, Response, NextFunction } from 'express';
import {
  PriceHistoryUseCase,
  PriceHistoryError,
} from '../../../application/use-cases/PriceHistoryUseCase';
import { AppError } from '../middlewares/errorHandler';

export class PriceHistoryController {
  constructor(private useCase: PriceHistoryUseCase) {}

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productId = req.params.id as string;
      const variantId = typeof req.query.variantId === 'string' ? req.query.variantId : undefined;
      const daysRaw = req.query.days;
      const days = daysRaw === undefined ? undefined : Number(daysRaw);

      const result = await this.useCase.getHistory({ productId, variantId, days });
      res.json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  private mapError(err: unknown): AppError | Error {
    if (err instanceof PriceHistoryError) return new AppError(err.statusCode, err.message);
    if (err instanceof AppError) return err;
    return err as Error;
  }
}
