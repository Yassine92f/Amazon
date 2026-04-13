import { Request, Response, NextFunction } from 'express';
import { UserRole, UserStatus } from '@ecommerce/shared';
import { AdminUseCase, AdminError } from '../../../application/use-cases/AdminUseCase';
import { AppError } from '../middlewares/errorHandler';

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
        throw new AppError(400, 'Rôle invalide');
      }
      if (status && !Object.values(UserStatus).includes(status)) {
        throw new AppError(400, 'Statut invalide');
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
        throw new AppError(400, 'ID utilisateur requis');
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
        throw new AppError(400, 'ID utilisateur requis');
      }
      if (!status) {
        throw new AppError(400, 'Le statut est requis');
      }
      if (!Object.values(UserStatus).includes(status)) {
        throw new AppError(400, 'Statut invalide');
      }

      const user = await this.adminUseCase.updateUserStatus(id, status, reason);
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
        throw new AppError(400, 'ID utilisateur requis');
      }
      if (!role) {
        throw new AppError(400, 'Le role est requis');
      }
      if (!Object.values(UserRole).includes(role)) {
        throw new AppError(400, 'Role invalide');
      }

      const user = await this.adminUseCase.updateUserRole(id, role);
      res.json({ success: true, data: user });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new AppError(400, 'ID utilisateur requis');
      }

      await this.adminUseCase.deleteUser(id);
      res.json({ success: true, message: 'Utilisateur supprimé' });
    } catch (err) {
      next(this.mapError(err));
    }
  };

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
