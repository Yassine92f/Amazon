import { Request, Response, NextFunction } from 'express';
import { UserRole, UserStatus } from '@ecommerce/shared';
import { AdminUseCase, AdminError, AdminActor } from '../../../application/use-cases/AdminUseCase';
import { AuditAction } from '../../../domain/entities/AuditLog';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';

export class AdminController {
  constructor(private adminUseCase: AdminUseCase) {}

  getDashboardStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.adminUseCase.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
      const query = req.query.query as string | undefined;
      const role = req.query.role as UserRole | undefined;
      const status = req.query.status as UserStatus | undefined;

      if (role && !Object.values(UserRole).includes(role)) {
        throw new AppError(400, 'Invalid role');
      }
      if (status && !Object.values(UserStatus).includes(status)) {
        throw new AppError(400, 'Invalid status');
      }

      const result = await this.adminUseCase.getUsers({
        page,
        limit,
        sortBy,
        sortOrder,
        query,
        role,
        status,
      });

      res.json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new AppError(400, 'User ID is required');
      }

      const user = await this.adminUseCase.getUserById(id);
      res.json({ success: true, data: user });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const { status, reason } = req.body;

      if (!id) {
        throw new AppError(400, 'User ID is required');
      }
      if (!status) {
        throw new AppError(400, 'Status is required');
      }
      if (!Object.values(UserStatus).includes(status)) {
        throw new AppError(400, 'Invalid status');
      }

      const user = await this.adminUseCase.updateUserStatus(
        id,
        status,
        this.extractActor(req),
        reason,
      );
      res.json({ success: true, data: user });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const { role } = req.body;

      if (!id) {
        throw new AppError(400, 'User ID is required');
      }
      if (!role) {
        throw new AppError(400, 'Role is required');
      }
      if (!Object.values(UserRole).includes(role)) {
        throw new AppError(400, 'Invalid role');
      }

      const user = await this.adminUseCase.updateUserRole(id, role, this.extractActor(req));
      res.json({ success: true, data: user });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new AppError(400, 'User ID is required');
      }

      await this.adminUseCase.deleteUser(id, this.extractActor(req));
      res.json({ success: true, message: 'User deleted' });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const action = req.query.action as AuditAction | undefined;
      const actorId = req.query.actorId as string | undefined;
      const targetId = req.query.targetId as string | undefined;

      if (action && !Object.values(AuditAction).includes(action)) {
        throw new AppError(400, 'Invalid action filter');
      }

      const result = await this.adminUseCase.getAuditLogs({
        page,
        limit,
        action,
        actorId,
        targetId,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  private extractActor(req: Request): AdminActor {
    const authReq = req as AuthRequest;
    return {
      id: authReq.userId,
      email: authReq.userEmail,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    };
  }

  private mapError(err: unknown): AppError | Error {
    if (err instanceof AdminError) {
      return new AppError(err.statusCode, err.message);
    }
    if (err instanceof AppError) {
      return err;
    }
    return err as Error;
  }
}
