import mongoose from 'mongoose';
import { IWishlistRepository } from '../../domain/repositories/IWishlistRepository';
import { WishlistEntity } from '../../domain/entities/Wishlist';
import { WishlistModel, WishlistDocument } from '../database/models/Wishlist';

export class WishlistRepository implements IWishlistRepository {
  async findByUser(userId: string): Promise<WishlistEntity | null> {
    if (!mongoose.isValidObjectId(userId)) return null;
    const doc = await WishlistModel.findOne({ userId });
    return doc ? this.toEntity(doc) : null;
  }

  async addItem(userId: string, productId: string): Promise<WishlistEntity> {
    const productObjectId = new mongoose.Types.ObjectId(productId);
    // Ensure the wishlist document exists, then add the item only if not already present.
    await WishlistModel.updateOne(
      { userId },
      { $setOnInsert: { userId, items: [] } },
      { upsert: true },
    );
    await WishlistModel.updateOne(
      { userId, 'items.productId': { $ne: productObjectId } },
      { $push: { items: { productId: productObjectId, addedAt: new Date() } } },
    );
    const doc = await WishlistModel.findOne({ userId });
    return this.toEntity(doc!);
  }

  async removeItem(userId: string, productId: string): Promise<WishlistEntity> {
    const productObjectId = new mongoose.Types.ObjectId(productId);
    await WishlistModel.updateOne({ userId }, { $pull: { items: { productId: productObjectId } } });
    const doc = await WishlistModel.findOne({ userId });
    return doc
      ? this.toEntity(doc)
      : {
          id: '',
          userId,
          items: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
  }

  private toEntity(doc: WishlistDocument): WishlistEntity {
    return {
      id: (doc._id as { toString: () => string }).toString(),
      userId: doc.userId.toString(),
      items: doc.items.map((i) => ({
        productId: i.productId.toString(),
        addedAt: i.addedAt,
      })),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
