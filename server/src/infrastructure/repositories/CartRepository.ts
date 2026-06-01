import mongoose from 'mongoose';
import { ICartRepository } from '../../domain/repositories/ICartRepository';
import { CartEntity, CartItemEntity, CartOwner } from '../../domain/entities/Cart';
import { CartModel, CartDocument } from '../database/models/Cart';
import { getRedisClient } from '../cache/redis';

const GUEST_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const guestKey = (id: string) => `cart:guest:${id}`;

export class CartRepository implements ICartRepository {
  async get(owner: CartOwner): Promise<CartEntity | null> {
    if (owner.type === 'user') {
      if (!mongoose.isValidObjectId(owner.id)) return null;
      const doc = await CartModel.findOne({ userId: owner.id });
      return doc ? this.toEntity(owner, doc) : null;
    }

    const raw = await getRedisClient().get(guestKey(owner.id));
    if (!raw) return null;
    const items = JSON.parse(raw) as CartItemEntity[];
    return { owner, items };
  }

  async save(owner: CartOwner, items: CartItemEntity[]): Promise<CartEntity> {
    if (owner.type === 'user') {
      const doc = await CartModel.findOneAndUpdate(
        { userId: owner.id },
        {
          userId: owner.id,
          items: items.map((i) => ({
            productId: new mongoose.Types.ObjectId(i.productId),
            variantId: new mongoose.Types.ObjectId(i.variantId),
            quantity: i.quantity,
            price: i.price,
          })),
        },
        { upsert: true, new: true },
      );
      return this.toEntity(owner, doc);
    }

    await getRedisClient().set(guestKey(owner.id), JSON.stringify(items), 'EX', GUEST_TTL_SECONDS);
    return { owner, items };
  }

  async clear(owner: CartOwner): Promise<void> {
    if (owner.type === 'user') {
      await CartModel.deleteOne({ userId: owner.id });
      return;
    }
    await getRedisClient().del(guestKey(owner.id));
  }

  private toEntity(owner: CartOwner, doc: CartDocument): CartEntity {
    return {
      owner,
      items: doc.items.map((i) => ({
        productId: i.productId.toString(),
        variantId: i.variantId.toString(),
        quantity: i.quantity,
        price: i.price,
      })),
      updatedAt: doc.updatedAt,
    };
  }
}
