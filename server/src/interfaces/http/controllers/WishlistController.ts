import { Request, Response, NextFunction } from 'express';
import { WishlistUseCase, WishlistError } from '../../../application/use-cases/WishlistUseCase';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';

export class WishlistController {
  constructor(private wishlistUseCase: WishlistUseCase) {}

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const wishlist = await this.wishlistUseCase.getWishlist(userId);
      res.json({ success: true, data: wishlist });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  add = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const wishlist = await this.wishlistUseCase.add(userId, req.params.productId as string);
      res.status(201).json({ success: true, data: wishlist });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const wishlist = await this.wishlistUseCase.remove(userId, req.params.productId as string);
      res.json({ success: true, data: wishlist });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  toggle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const result = await this.wishlistUseCase.toggle(userId, req.params.productId as string);
      res.json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  private mapError(err: unknown): AppError | Error {
    if (err instanceof WishlistError) return new AppError(err.statusCode, err.message);
    if (err instanceof AppError) return err;
    return err as Error;
  }
}
