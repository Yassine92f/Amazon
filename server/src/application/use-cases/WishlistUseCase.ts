import { IWishlistRepository } from '../../domain/repositories/IWishlistRepository';
import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { WishlistEntity } from '../../domain/entities/Wishlist';

export interface WishlistItemDto {
  productId: string;
  addedAt: string;
  name?: string;
  slug?: string;
  image?: string;
  price?: number;
  inStock?: boolean;
}

export interface WishlistDto {
  items: WishlistItemDto[];
  count: number;
}

export class WishlistUseCase {
  constructor(
    private wishlistRepo: IWishlistRepository,
    private productRepo: IProductRepository,
  ) {}

  async getWishlist(userId: string): Promise<WishlistDto> {
    const wishlist = await this.wishlistRepo.findByUser(userId);
    return this.buildDto(wishlist);
  }

  async add(userId: string, productId: string): Promise<WishlistDto> {
    const product = await this.productRepo.findById(productId);
    if (!product || !product.isActive) throw new WishlistError(404, 'Product not found');
    const wishlist = await this.wishlistRepo.addItem(userId, productId);
    return this.buildDto(wishlist);
  }

  async remove(userId: string, productId: string): Promise<WishlistDto> {
    const wishlist = await this.wishlistRepo.removeItem(userId, productId);
    return this.buildDto(wishlist);
  }

  async toggle(
    userId: string,
    productId: string,
  ): Promise<{ wishlisted: boolean; wishlist: WishlistDto }> {
    const current = await this.wishlistRepo.findByUser(userId);
    const present = current?.items.some((i) => i.productId === productId) ?? false;
    if (present) {
      const wishlist = await this.wishlistRepo.removeItem(userId, productId);
      return { wishlisted: false, wishlist: await this.buildDto(wishlist) };
    }
    const product = await this.productRepo.findById(productId);
    if (!product || !product.isActive) throw new WishlistError(404, 'Product not found');
    const wishlist = await this.wishlistRepo.addItem(userId, productId);
    return { wishlisted: true, wishlist: await this.buildDto(wishlist) };
  }

  private async buildDto(wishlist: WishlistEntity | null): Promise<WishlistDto> {
    if (!wishlist || wishlist.items.length === 0) return { items: [], count: 0 };

    const items: WishlistItemDto[] = [];
    for (const it of wishlist.items) {
      const product = await this.productRepo.findById(it.productId);
      const cheapest = product?.variants.reduce<number | undefined>(
        (min, v) => (min === undefined || v.price < min ? v.price : min),
        undefined,
      );
      items.push({
        productId: it.productId,
        addedAt: it.addedAt.toISOString(),
        name: product?.name,
        slug: product?.slug,
        image: product?.images[0],
        price: cheapest,
        inStock: product?.variants.some((v) => v.stock > 0),
      });
    }
    return { items, count: items.length };
  }
}

export class WishlistError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, WishlistError.prototype);
  }
}
