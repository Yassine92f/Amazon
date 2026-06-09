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

export interface CreateReviewData {
  userId: string;
  productId: string;
  orderId: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
}

export interface IReviewRepository {
  create(data: CreateReviewData): Promise<ReviewEntity>;
  // Reviews a user already wrote for the products of one order.
  findByOrderAndUser(orderId: string, userId: string): Promise<ReviewEntity[]>;
  findByProduct(params: FindReviewsParams): Promise<{ reviews: ReviewEntity[]; total: number }>;
  getStats(productId: string): Promise<ReviewStats>;
  findById(id: string): Promise<ReviewEntity | null>;
  findForSellerProducts(
    params: FindSellerReviewsParams,
  ): Promise<{ reviews: ReviewEntity[]; total: number }>;
  setSellerResponse(reviewId: string, comment: string): Promise<ReviewEntity | null>;
}
