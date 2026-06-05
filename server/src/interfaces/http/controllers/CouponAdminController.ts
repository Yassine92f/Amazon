import { Request, Response, NextFunction } from 'express';
import {
  CouponAdminUseCase,
  CouponAdminError,
} from '../../../application/use-cases/CouponAdminUseCase';
import { AppError } from '../middlewares/errorHandler';

export class CouponAdminController {
  constructor(private useCase: CouponAdminUseCase) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const result = await this.useCase.list(page, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const coupon = await this.useCase.create(req.body);
      res.status(201).json({ success: true, data: coupon });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const coupon = await this.useCase.update(req.params.id as string, req.body);
      res.json({ success: true, data: coupon });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.useCase.remove(req.params.id as string);
      res.json({ success: true, message: 'Coupon supprimé' });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  private mapError(err: unknown): AppError | Error {
    if (err instanceof CouponAdminError) return new AppError(err.statusCode, err.message);
    if (err instanceof AppError) return err;
    return err as Error;
  }
}
