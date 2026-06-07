import { Request, Response, NextFunction } from 'express';
import { ProductUseCase, ProductError } from '../../../application/use-cases/ProductUseCase';
import { ProductListFilters } from '../../../domain/repositories/IProductRepository';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';
import { invalidateNamespace } from '../middlewares/cache';

const VALID_SORT = new Set(['createdAt', 'price', 'rating', 'totalSold', 'relevance']);

export class ProductController {
  constructor(private productUseCase: ProductUseCase) {}

  search = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = this.parseFilters(req);
      const result = await this.productUseCase.search(filters);
      res.json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  getBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await this.productUseCase.getBySlug(req.params.slug as string);
      res.json({ success: true, data: product });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await this.productUseCase.getById(req.params.id as string);
      res.json({ success: true, data: product });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const product = await this.productUseCase.create(userId, req.body);
      await invalidateNamespace('products');
      res.status(201).json({ success: true, data: product });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const product = await this.productUseCase.update(userId, req.params.id as string, req.body);
      await invalidateNamespace('products');
      res.json({ success: true, data: product });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      await this.productUseCase.delete(userId, req.params.id as string);
      await invalidateNamespace('products');
      res.json({ success: true, message: 'Product deleted' });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  getMyProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const product = await this.productUseCase.getMyProduct(userId, req.params.id as string);
      res.json({ success: true, data: product });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  listMyProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const filters = this.parseFilters(req);
      const result = await this.productUseCase.listMyProducts(userId, filters);
      res.json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  private parseFilters(req: Request): ProductListFilters {
    const q = req.query;
    const page = Math.max(1, parseInt(q.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(q.limit as string) || 20));
    const sortBy = VALID_SORT.has(q.sortBy as string)
      ? (q.sortBy as ProductListFilters['sortBy'])
      : undefined;
    const sortOrder = q.sortOrder === 'asc' ? 'asc' : 'desc';

    const csv = (key: string): string[] | undefined => {
      const raw = q[key];
      if (!raw) return undefined;
      const arr = Array.isArray(raw) ? raw : String(raw).split(',');
      return arr.map((s) => String(s).trim()).filter(Boolean);
    };

    const num = (key: string): number | undefined => {
      const v = q[key];
      if (v === undefined) return undefined;
      const parsed = Number(v);
      return Number.isFinite(parsed) ? parsed : undefined;
    };

    return {
      page,
      limit,
      sortBy,
      sortOrder,
      query: q.query as string | undefined,
      categoryIds: csv('categoryId') ?? csv('categoryIds'),
      brands: csv('brand') ?? csv('brands'),
      tags: csv('tag') ?? csv('tags'),
      minPrice: num('minPrice'),
      maxPrice: num('maxPrice'),
      minRating: num('minRating'),
      inStock: q.inStock === 'true' ? true : undefined,
      sellerId: q.sellerId as string | undefined,
      isFeatured: q.isFeatured === 'true' ? true : undefined,
    };
  }

  private mapError(err: unknown): AppError | Error {
    if (err instanceof ProductError) return new AppError(err.statusCode, err.message);
    if (err instanceof AppError) return err;
    return err as Error;
  }
}
