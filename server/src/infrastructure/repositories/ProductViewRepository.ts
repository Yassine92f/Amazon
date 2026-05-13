import mongoose from 'mongoose';
import {
  IProductViewRepository,
  RecentView,
} from '../../domain/repositories/IProductViewRepository';
import { ProductViewModel } from '../database/models/ProductView';

export class ProductViewRepository implements IProductViewRepository {
  async record(userId: string, productId: string): Promise<void> {
    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(productId)) return;
    // Upsert so a repeat view just refreshes the timestamp.
    await ProductViewModel.updateOne(
      { userId, productId },
      { $set: { viewedAt: new Date() } },
      { upsert: true },
    );
  }

  async findRecentByUser(userId: string, limit: number): Promise<RecentView[]> {
    if (!mongoose.isValidObjectId(userId)) return [];
    const docs = await ProductViewModel.find({ userId }).sort({ viewedAt: -1 }).limit(limit).lean();
    return docs.map((d) => ({ productId: String(d.productId), viewedAt: d.viewedAt }));
  }
}
