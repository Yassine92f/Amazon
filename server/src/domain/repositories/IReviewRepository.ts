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

export interface FindSellerReviewsParams {
  productIds: string[];
  page: number;
  limit: number;
  onlyUnanswered?: boolean;
}

export interface IReviewRepository {
  findByProduct(params: FindReviewsParams): Promise<{ reviews: ReviewEntity[]; total: number }>;
  getStats(productId: string): Promise<ReviewStats>;
  findById(id: string): Promise<ReviewEntity | null>;
  findForSellerProducts(
    params: FindSellerReviewsParams,
  ): Promise<{ reviews: ReviewEntity[]; total: number }>;
  setSellerResponse(reviewId: string, comment: string): Promise<ReviewEntity | null>;
}
