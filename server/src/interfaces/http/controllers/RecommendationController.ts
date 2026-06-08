import { Request, Response, NextFunction } from 'express';
import { RecommendationUseCase } from '../../../application/use-cases/RecommendationUseCase';
import { AuthRequest } from '../middlewares/auth';

export class RecommendationController {
  constructor(private recommendationUseCase: RecommendationUseCase) {}

  // GET /recommendations — personalized list for the authenticated user.
  forMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const limit = this.parseLimit(req.query.limit, 10, 24);
      const items = await this.recommendationUseCase.getForUser(userId, limit);
      res.json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  };

  // GET /recommendations/similar/:productId — "you may also like" (public).
  similar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = this.parseLimit(req.query.limit, 8, 24);
      const items = await this.recommendationUseCase.getSimilarToProduct(
        req.params.productId as string,
        limit,
      );
      res.json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  };

  // POST /recommendations/views/:productId — record a view (no-op for guests).
  recordView = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthRequest).userId;
      if (userId) {
        await this.recommendationUseCase.recordView(userId, req.params.productId as string);
      }
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  };

  private parseLimit(raw: unknown, fallback: number, max: number): number {
    const n = parseInt(raw as string, 10);
    if (!Number.isFinite(n) || n < 1) return fallback;
    return Math.min(n, max);
  }
}
