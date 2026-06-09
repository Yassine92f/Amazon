import { Request, Response, NextFunction } from 'express';
import { DisputeStatus } from '@ecommerce/shared';
import { DisputeUseCase, DisputeError } from '../../../application/use-cases/DisputeUseCase';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';

export class DisputeController {
  constructor(private disputeUseCase: DisputeUseCase) {}

  // POST /disputes — buyer opens a dispute.
  open = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const dispute = await this.disputeUseCase.open(userId, req.body);
      res.status(201).json({ success: true, data: dispute });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  // GET /disputes/mine — buyer's own disputes.
  mine = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const page = Number(req.query.page) || 1;
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const result = await this.disputeUseCase.listMine(userId, page, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  // GET /disputes — admin list (optional ?status= filter).
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const statusParam = req.query.status as string | undefined;
      const status = Object.values(DisputeStatus).includes(statusParam as DisputeStatus)
        ? (statusParam as DisputeStatus)
        : undefined;
      const result = await this.disputeUseCase.listAll(page, limit, status);
      res.json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  // PATCH /disputes/:id — admin resolves / rejects / marks under review.
  resolve = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dispute = await this.disputeUseCase.resolve(req.params.id as string, req.body);
      res.json({ success: true, data: dispute });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  private mapError(err: unknown): AppError | Error {
    if (err instanceof DisputeError) return new AppError(err.statusCode, err.message);
    return err as Error;
  }
}
