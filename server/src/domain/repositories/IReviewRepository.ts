import { ReviewEntity } from '../entities/Review';

export interface FindReviewsParams {
  productId: string;
  page: number;
  limit: number;
  sortBy?: 'createdAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
  minRating?: number;
}

export interface ReviewStats {
  averageRating: number;
  total: number;
  distribution: { stars: number; count: number }[];
}

export interface IReviewRepository {
  findByProduct(params: FindReviewsParams): Promise<{ reviews: ReviewEntity[]; total: number }>;
  getStats(productId: string): Promise<ReviewStats>;
}
