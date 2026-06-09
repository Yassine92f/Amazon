import { WishlistEntity } from '../entities/Wishlist';

export interface IWishlistRepository {
  findByUser(userId: string): Promise<WishlistEntity | null>;
  addItem(userId: string, productId: string): Promise<WishlistEntity>;
  removeItem(userId: string, productId: string): Promise<WishlistEntity>;
}
