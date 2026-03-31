import { Request, Response, NextFunction } from 'express';
import { SellerUseCase, SellerError } from '../../../application/use-cases/SellerUseCase';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';

export class SellerController {
  constructor(private sellerUseCase: SellerUseCase) {}

  becomeSeller = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const { shopName, description } = req.body;
      const seller = await this.sellerUseCase.becomeSeller({ userId, shopName, description });
      res.status(201).json({ success: true, data: seller });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  getMyShop = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const seller = await this.sellerUseCase.getMyShop(userId);
      res.json({ success: true, data: seller });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  updateMyShop = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const seller = await this.sellerUseCase.updateMyShop(userId, req.body);
      res.json({ success: true, data: seller });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  getPublicShop = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slug = req.params.slug as string;
      const seller = await this.sellerUseCase.getPublicShop(slug);
      res.json({ success: true, data: seller });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  listSellers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const isVerified =
        req.query.isVerified === 'true'
          ? true
          : req.query.isVerified === 'false'
            ? false
            : undefined;
      const result = await this.sellerUseCase.listSellers({
        page,
        limit,
        query: req.query.query as string | undefined,
        isVerified,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  verifySeller = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const { isVerified, commissionRate } = req.body;
      const seller = await this.sellerUseCase.verifySeller(id, isVerified, commissionRate);
      res.json({ success: true, data: seller });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  private mapError(err: unknown): AppError | Error {
    if (err instanceof SellerError) {
      return new AppError(err.statusCode, err.message);
    }
    if (err instanceof AppError) {
      return err;
    }
    return err as Error;
  }
}
