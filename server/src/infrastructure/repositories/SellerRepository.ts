import {
  ISellerRepository,
  CreateSellerData,
  UpdateSellerData,
  FindSellersParams,
} from '../../domain/repositories/ISellerRepository';
import { SellerEntity } from '../../domain/entities/Seller';
import { SellerModel, SellerDocument } from '../database/models/Seller';

export class SellerRepository implements ISellerRepository {
  async findById(id: string): Promise<SellerEntity | null> {
    const doc = await SellerModel.findById(id);
    return doc ? this.toEntity(doc) : null;
  }

  async findByUserId(userId: string): Promise<SellerEntity | null> {
    const doc = await SellerModel.findOne({ userId });
    return doc ? this.toEntity(doc) : null;
  }

  async findBySlug(slug: string): Promise<SellerEntity | null> {
    const doc = await SellerModel.findOne({ shopSlug: slug.toLowerCase() });
    return doc ? this.toEntity(doc) : null;
  }

  async shopNameExists(shopName: string): Promise<boolean> {
    const doc = await SellerModel.exists({
      shopName: { $regex: `^${escapeRegex(shopName)}$`, $options: 'i' },
    });
    return doc !== null;
  }

  async create(data: CreateSellerData): Promise<SellerEntity> {
    const doc = await SellerModel.create(data);
    return this.toEntity(doc);
  }

  async updateByUserId(userId: string, data: UpdateSellerData): Promise<SellerEntity | null> {
    const doc = await SellerModel.findOneAndUpdate({ userId }, { $set: data }, { new: true });
    return doc ? this.toEntity(doc) : null;
  }

  async setVerified(
    id: string,
    isVerified: boolean,
    commissionRate?: number,
  ): Promise<SellerEntity | null> {
    const update: Record<string, unknown> = { isVerified };
    if (commissionRate !== undefined) update.commissionRate = commissionRate;
    const doc = await SellerModel.findByIdAndUpdate(id, { $set: update }, { new: true });
    return doc ? this.toEntity(doc) : null;
  }

  async incrementSales(sellerId: string, salesDelta: number, revenueDelta: number): Promise<void> {
    await SellerModel.updateOne(
      { _id: sellerId },
      { $inc: { totalSales: salesDelta, totalRevenue: revenueDelta } },
    );
  }

  async findMany(params: FindSellersParams): Promise<{ sellers: SellerEntity[]; total: number }> {
    const filter: Record<string, unknown> = {};
    if (params.isVerified !== undefined) filter.isVerified = params.isVerified;
    if (params.query) {
      filter.shopName = { $regex: escapeRegex(params.query), $options: 'i' };
    }

    const [docs, total] = await Promise.all([
      SellerModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((params.page - 1) * params.limit)
        .limit(params.limit),
      SellerModel.countDocuments(filter),
    ]);

    return { sellers: docs.map((d) => this.toEntity(d)), total };
  }

  private toEntity(doc: SellerDocument): SellerEntity {
    return {
      id: (doc._id as { toString: () => string }).toString(),
      userId: doc.userId.toString(),
      shopName: doc.shopName,
      shopSlug: doc.shopSlug,
      description: doc.description,
      logo: doc.logo,
      banner: doc.banner,
      rating: doc.rating,
      reviewCount: doc.reviewCount,
      totalSales: doc.totalSales,
      totalRevenue: doc.totalRevenue,
      isVerified: doc.isVerified,
      commissionRate: doc.commissionRate,
      joinedAt: doc.joinedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
