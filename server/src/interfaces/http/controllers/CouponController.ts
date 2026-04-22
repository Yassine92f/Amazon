import { Request, Response, NextFunction } from 'express';
import { CouponUseCase, CouponError } from '../../../application/use-cases/CouponUseCase';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';

export class CouponController {
  constructor(private couponUseCase: CouponUseCase) {}

  validate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const result = await this.couponUseCase.validate(req.body.code, req.body.subtotal, userId);
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
