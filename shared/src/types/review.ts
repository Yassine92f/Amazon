import { BaseEntity } from './common';

export interface Review extends BaseEntity {
  userId: string;
  productId: string;
  orderId: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  sellerResponse?: {
    comment: string;
    respondedAt: string;
  };
}

export interface CreateReviewRequest {
  productId: string;
  orderId: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
}

export interface SellerReviewResponse {
  comment: string;
}
