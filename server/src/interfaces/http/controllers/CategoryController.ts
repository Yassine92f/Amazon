import { Request, Response, NextFunction } from 'express';
import { CategoryUseCase, CategoryError } from '../../../application/use-cases/CategoryUseCase';
import { AppError } from '../middlewares/errorHandler';
import { invalidateNamespace } from '../middlewares/cache';

export class CategoryController {
  constructor(private categoryUseCase: CategoryUseCase) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const categories = await this.categoryUseCase.list(includeInactive);
      res.json({ success: true, data: categories });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  tree = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const tree = await this.categoryUseCase.tree();
      res.json({ success: true, data: tree });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  getBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = await this.categoryUseCase.getBySlug(req.params.slug as string);
      res.json({ success: true, data: category });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = await this.categoryUseCase.create(req.body);
      await invalidateNamespace('categories');
      res.status(201).json({ success: true, data: category });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const category = await this.categoryUseCase.update(id, req.body);
      await invalidateNamespace('categories');
      res.json({ success: true, data: category });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      await this.categoryUseCase.delete(id);
      await invalidateNamespace('categories');
      res.json({ success: true, message: 'Category deleted' });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  private mapError(err: unknown): AppError | Error {
    if (err instanceof CategoryError) return new AppError(err.statusCode, err.message);
    if (err instanceof AppError) return err;
    return err as Error;
  }
}
