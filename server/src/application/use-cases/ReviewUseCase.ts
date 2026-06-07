import { OrderStatus } from '@ecommerce/shared';
import { IReviewRepository } from '../../domain/repositories/IReviewRepository';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { ReviewEntity } from '../../domain/entities/Review';

export interface CreateReviewInput {
  productId: string;
  orderId: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
}

export interface ReviewDto {
  _id: string;
  productId: string;
  orderId: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
}

export class ReviewUseCase {
  constructor(
    private reviewRepo: IReviewRepository,
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository,
  ) {}

  // A buyer may review a product only from one of their delivered orders that
  // actually contains it, and only once per (order, product).
  async createReview(userId: string, input: CreateReviewInput): Promise<ReviewDto> {
    if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
      throw new ReviewError(400, 'La note doit être comprise entre 1 et 5');
    }

    const order = await this.orderRepo.findById(input.orderId);
    if (!order) throw new ReviewError(404, 'Commande introuvable');
    if (order.userId !== userId) {
      throw new ReviewError(403, 'Cette commande ne vous appartient pas');
    }
    if (order.status !== OrderStatus.DELIVERED) {
      throw new ReviewError(400, 'Vous pourrez laisser un avis une fois la commande livrée');
    }
    if (!order.items.some((i) => i.productId === input.productId)) {
      throw new ReviewError(400, 'Ce produit ne fait pas partie de cette commande');
    }

    const existing = await this.reviewRepo.findByOrderAndUser(input.orderId, userId);
    if (existing.some((r) => r.productId === input.productId)) {
      throw new ReviewError(409, 'Vous avez déjà laissé un avis pour ce produit');
    }

    const review = await this.reviewRepo.create({
      userId,
      productId: input.productId,
      orderId: input.orderId,
      rating: input.rating,
      title: input.title,
      comment: input.comment,
      images: input.images,
    });

    // Resync the product's denormalized rating + reviewCount from all its reviews.
    const stats = await this.reviewRepo.getStats(input.productId);
    await this.productRepo.updateRating(input.productId, stats.averageRating, stats.total);

    return this.toDto(review);
  }

  // Product ids the user has already reviewed within an order (to drive the UI).
  async listReviewedProductIds(userId: string, orderId: string): Promise<string[]> {
    const reviews = await this.reviewRepo.findByOrderAndUser(orderId, userId);
    return reviews.map((r) => r.productId);
  }

  private toDto(r: ReviewEntity): ReviewDto {
    return {
      _id: r.id,
      productId: r.productId,
      orderId: r.orderId,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    };
  }
}

export class ReviewError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, ReviewError.prototype);
  }
}
