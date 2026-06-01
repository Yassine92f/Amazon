import { IReviewRepository, FindReviewsParams } from '../../domain/repositories/IReviewRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ReviewEntity } from '../../domain/entities/Review';

export interface ReviewDto {
  _id: string;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  productId: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  sellerResponse?: { comment: string; respondedAt: string };
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedReviewsDto {
  items: ReviewDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  stats: {
    averageRating: number;
    total: number;
    distribution: { stars: number; count: number }[];
  };
}

export class ReviewBrowseUseCase {
  constructor(
    private reviewRepo: IReviewRepository,
    private userRepo: IUserRepository,
  ) {}

  async listForProduct(params: FindReviewsParams): Promise<PaginatedReviewsDto> {
    const [{ reviews, total }, stats] = await Promise.all([
      this.reviewRepo.findByProduct(params),
      this.reviewRepo.getStats(params.productId),
    ]);

    const items = await Promise.all(reviews.map((r) => this.toDto(r)));
    const totalPages = Math.ceil(total / params.limit);

    return {
      items,
      total,
      page: params.page,
      limit: params.limit,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
      stats,
    };
  }

  private async toDto(r: ReviewEntity): Promise<ReviewDto> {
    const author = await this.userRepo.findById(r.userId);
    return {
      _id: r.id,
      userId: r.userId,
      authorName: author ? `${author.firstName} ${author.lastName.charAt(0)}.` : 'Anonymous',
      authorAvatar: author?.avatar,
      productId: r.productId,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      images: r.images,
      sellerResponse: r.sellerResponse
        ? {
            comment: r.sellerResponse.comment,
            respondedAt: r.sellerResponse.respondedAt.toISOString(),
          }
        : undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }
}
