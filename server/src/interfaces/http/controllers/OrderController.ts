import { Request, Response, NextFunction } from 'express';
import { OrderStatus } from '@ecommerce/shared';
import {
  OrderUseCase,
  OrderError,
  OrderHistoryFilters,
} from '../../../application/use-cases/OrderUseCase';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';

export class OrderController {
  constructor(private orderUseCase: OrderUseCase) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const order = await this.orderUseCase.createOrder(userId, req.body);
      res.status(201).json({ success: true, data: order });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const result = await this.orderUseCase.getMyOrders(userId, this.parseFilters(req));
      res.json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  getOne = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, userRole } = req as AuthRequest;
      const order = await this.orderUseCase.getOrderById(userId, userRole, req.params.id as string);
      res.json({ success: true, data: order });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  sellerList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const result = await this.orderUseCase.getSellerOrders(userId, this.parseFilters(req));
      res.json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, userRole } = req as AuthRequest;
      const order = await this.orderUseCase.updateStatus(
        userId,
        userRole,
        req.params.id as string,
        req.body.status,
      );
      res.json({ success: true, data: order });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const order = await this.orderUseCase.cancelOrder(userId, req.params.id as string);
      res.json({ success: true, data: order });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  private parseFilters(req: Request): OrderHistoryFilters {
    const q = req.query;
    const page = Math.max(1, parseInt(q.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(q.limit as string) || 20));
    const status = Object.values(OrderStatus).includes(q.status as OrderStatus)
      ? (q.status as OrderStatus)
      : undefined;
    const parseDate = (v: unknown): Date | undefined => {
      if (typeof v !== 'string') return undefined;
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? undefined : d;
    };
    return {
      page,
      limit,
      status,
      fromDate: parseDate(q.fromDate),
      toDate: parseDate(q.toDate),
    };
  }

  private mapError(err: unknown): AppError | Error {
    if (err instanceof OrderError) return new AppError(err.statusCode, err.message);
    if (err instanceof AppError) return err;
    return err as Error;
  }
}
