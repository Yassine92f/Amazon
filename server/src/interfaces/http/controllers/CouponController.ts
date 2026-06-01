import { Request, Response, NextFunction } from 'express';
import { CouponUseCase, CouponError } from '../../../application/use-cases/CouponUseCase';
import { AppError } from '../middlewares/errorHandler';

export class CouponController {
  constructor(private couponUseCase: CouponUseCase) {}

  validate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.couponUseCase.validate(req.body.code, req.body.subtotal);
      res.json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  private mapError(err: unknown): AppError | Error {
    if (err instanceof CouponError) return new AppError(err.statusCode, err.message);
    if (err instanceof AppError) return err;
    return err as Error;
  }
}
