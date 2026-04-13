import { IReviewRepository } from '../../domain/repositories/IReviewRepository';
import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { ISellerRepository } from '../../domain/repositories/ISellerRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ReviewEntity } from '../../domain/entities/Review';

export interface SellerReviewDto {
  _id: string;
  productId: string;
  productName: string;
  productSlug: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  sellerResponse?: { comment: string; respondedAt: string };
  createdAt: string;
}

export interface PaginatedSellerReviewsDto {
  items: SellerReviewDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ListSellerReviewsParams {
  userId: string;
  page: number;
  limit: number;
  onlyUnanswered?: boolean;
}

/**
 * Lets a seller browse the reviews left on their own products and reply to them.
 * The reply is stored on the review's `sellerResponse` field (Section 2 — the
 * "réponses vendeur aux avis" requirement). Review creation itself is Section 3.
 */
export class SellerReviewUseCase {
  constructor(
    private reviewRepo: IReviewRepository,
    private productRepo: IProductRepository,
    private sellerRepo: ISellerRepository,
    private userRepo: IUserRepository,
  ) {}

  async listForSeller(params: ListSellerReviewsParams): Promise<PaginatedSellerReviewsDto> {
    const seller = await this.requireSeller(params.userId);

    // The seller's products (id → name/slug), including inactive ones.
    const { products } = await this.productRepo.search({
      sellerId: seller.id,
      page: 1,
      limit: 1000,
    });
    const productById = new Map(products.map((p) => [p.id, p]));
    const productIds = products.map((p) => p.id);

    const { reviews, total } = await this.reviewRepo.findForSellerProducts({
      productIds,
      page: params.page,
      limit: params.limit,
      onlyUnanswered: params.onlyUnanswered,
    });

    const items = await Promise.all(
      reviews.map(async (r) => {
        const product = productById.get(r.productId);
        return this.toDto(r, product?.name ?? '—', product?.slug ?? '');
      }),
    );

    const totalPages = Math.ceil(total / params.limit) || 1;
    return {
      items,
      total,
      page: params.page,
      limit: params.limit,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    };
  }

  async respond(userId: string, reviewId: string, comment: string): Promise<SellerReviewDto> {
    const seller = await this.requireSeller(userId);

    const review = await this.reviewRepo.findById(reviewId);
    if (!review) throw new SellerReviewError(404, 'Review not found');

    const product = await this.productRepo.findById(review.productId);
    if (!product || product.sellerId !== seller.id) {
      throw new SellerReviewError(403, 'This review is not on one of your products');
    }

    const updated = await this.reviewRepo.setSellerResponse(reviewId, comment.trim());
    if (!updated) throw new SellerReviewError(404, 'Review not found');

    return this.toDto(updated, product.name, product.slug);
  }

  private async requireSeller(userId: string) {
    const seller = await this.sellerRepo.findByUserId(userId);
    if (!seller) throw new SellerReviewError(403, 'You do not have a shop');
    return seller;
  }

  private async toDto(
    r: ReviewEntity,
    productName: string,
    productSlug: string,
  ): Promise<SellerReviewDto> {
    const author = await this.userRepo.findById(r.userId);
    return {
      _id: r.id,
      productId: r.productId,
      productName,
      productSlug,
      authorName: author ? `${author.firstName} ${author.lastName.charAt(0)}.` : 'Anonyme',
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      sellerResponse: r.sellerResponse
        ? {
            comment: r.sellerResponse.comment,
            respondedAt: r.sellerResponse.respondedAt.toISOString(),
          }
        : undefined,
      createdAt: r.createdAt.toISOString(),
    };
  }
}

export class SellerReviewError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, SellerReviewError.prototype);
  }
}
