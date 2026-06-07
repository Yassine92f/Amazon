import mongoose from 'mongoose';
import {
  IReviewRepository,
  FindReviewsParams,
  FindSellerReviewsParams,
  ReviewStats,
  CreateReviewData,
} from '../../domain/repositories/IReviewRepository';
import { ReviewEntity } from '../../domain/entities/Review';
import { ReviewModel, ReviewDocument } from '../database/models/Review';

export class ReviewRepository implements IReviewRepository {
  async create(data: CreateReviewData): Promise<ReviewEntity> {
    const doc = await ReviewModel.create({
      userId: new mongoose.Types.ObjectId(data.userId),
      productId: new mongoose.Types.ObjectId(data.productId),
      orderId: new mongoose.Types.ObjectId(data.orderId),
      rating: data.rating,
      title: data.title,
      comment: data.comment,
      images: data.images ?? [],
    });
    return this.toEntity(doc);
  }

  async findByOrderAndUser(orderId: string, userId: string): Promise<ReviewEntity[]> {
    if (!mongoose.isValidObjectId(orderId) || !mongoose.isValidObjectId(userId)) return [];
    const docs = await ReviewModel.find({
      orderId: new mongoose.Types.ObjectId(orderId),
      userId: new mongoose.Types.ObjectId(userId),
    });
    return docs.map((d) => this.toEntity(d));
  }

  async findByProduct(
    params: FindReviewsParams,
  ): Promise<{ reviews: ReviewEntity[]; total: number }> {
    const filter: Record<string, unknown> = { productId: params.productId };
    if (params.minRating !== undefined) filter.rating = { $gte: params.minRating };

    const sortField = params.sortBy === 'rating' ? 'rating' : 'createdAt';
    const sortOrder = params.sortOrder === 'asc' ? 1 : -1;

    const [docs, total] = await Promise.all([
      ReviewModel.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip((params.page - 1) * params.limit)
        .limit(params.limit),
      ReviewModel.countDocuments(filter),
    ]);

    return { reviews: docs.map((d) => this.toEntity(d)), total };
  }

  async getStats(productId: string): Promise<ReviewStats> {
    if (!mongoose.isValidObjectId(productId)) {
      return { averageRating: 0, total: 0, distribution: this.emptyDistribution() };
    }

    const result = await ReviewModel.aggregate<{
      total: { count: number; avg: number }[];
      buckets: { _id: number; count: number }[];
    }>([
      { $match: { productId: new mongoose.Types.ObjectId(productId) } },
      {
        $facet: {
          total: [
            {
              $group: { _id: null, count: { $sum: 1 }, avg: { $avg: '$rating' } },
            },
          ],
          buckets: [{ $group: { _id: '$rating', count: { $sum: 1 } } }],
        },
      },
    ]);

    const aggregate = result[0];
    const total = aggregate?.total?.[0]?.count ?? 0;
    const avg = aggregate?.total?.[0]?.avg ?? 0;
    const distribution = this.emptyDistribution();
    for (const bucket of aggregate?.buckets ?? []) {
      const target = distribution.find((d) => d.stars === bucket._id);
      if (target) target.count = bucket.count;
    }

    return { averageRating: Math.round(avg * 10) / 10, total, distribution };
  }

  async findById(id: string): Promise<ReviewEntity | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await ReviewModel.findById(id);
    return doc ? this.toEntity(doc) : null;
  }

  async findForSellerProducts(
    params: FindSellerReviewsParams,
  ): Promise<{ reviews: ReviewEntity[]; total: number }> {
    const ids = params.productIds.filter((id) => mongoose.isValidObjectId(id));
    if (ids.length === 0) return { reviews: [], total: 0 };

    const filter: Record<string, unknown> = {
      productId: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) },
    };
    if (params.onlyUnanswered) filter.sellerResponse = { $exists: false };

    const [docs, total] = await Promise.all([
      ReviewModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((params.page - 1) * params.limit)
        .limit(params.limit),
      ReviewModel.countDocuments(filter),
    ]);

    return { reviews: docs.map((d) => this.toEntity(d)), total };
  }

  async setSellerResponse(reviewId: string, comment: string): Promise<ReviewEntity | null> {
    if (!mongoose.isValidObjectId(reviewId)) return null;
    const doc = await ReviewModel.findByIdAndUpdate(
      reviewId,
      { sellerResponse: { comment, respondedAt: new Date() } },
      { new: true },
    );
    return doc ? this.toEntity(doc) : null;
  }

  private emptyDistribution() {
    return [1, 2, 3, 4, 5].map((stars) => ({ stars, count: 0 }));
  }

  private toEntity(doc: ReviewDocument): ReviewEntity {
    return {
      id: (doc._id as { toString: () => string }).toString(),
      userId: doc.userId.toString(),
      productId: doc.productId.toString(),
      orderId: doc.orderId.toString(),
      rating: doc.rating,
      title: doc.title,
      comment: doc.comment,
      images: doc.images,
      // Mongoose materializes the nested path as an empty object even when no
      // response was set, so gate on the actual comment, not the parent object.
      sellerResponse: doc.sellerResponse?.comment
        ? {
            comment: doc.sellerResponse.comment,
            respondedAt: doc.sellerResponse.respondedAt,
          }
        : undefined,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
