import { Cart, CartItem } from '@ecommerce/shared';
import { ICartRepository } from '../../domain/repositories/ICartRepository';
import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { CartItemEntity, CartOwner } from '../../domain/entities/Cart';
import { ProductEntity, ProductVariantEntity } from '../../domain/entities/Product';

export interface AddItemInput {
  productId: string;
  variantId: string;
  quantity: number;
}

export class CartUseCase {
  constructor(
    private cartRepo: ICartRepository,
    private productRepo: IProductRepository,
  ) {}

  async getCart(owner: CartOwner): Promise<Cart> {
    const cart = await this.cartRepo.get(owner);
    return this.buildDto(owner, cart?.items ?? []);
  }

  async addItem(owner: CartOwner, input: AddItemInput): Promise<Cart> {
    if (input.quantity < 1) throw new CartError(400, 'Quantity must be at least 1');
    const { variant } = await this.requireVariant(input.productId, input.variantId);

    const cart = await this.cartRepo.get(owner);
    const items = cart?.items ?? [];
    const existing = items.find(
      (i) => i.productId === input.productId && i.variantId === input.variantId,
    );
    const newQty = (existing?.quantity ?? 0) + input.quantity;
    if (newQty > variant.stock) {
      throw new CartError(409, `Only ${variant.stock} unit(s) in stock`);
    }

    if (existing) {
      existing.quantity = newQty;
      existing.price = variant.price;
    } else {
      items.push({
        productId: input.productId,
        variantId: input.variantId,
        quantity: input.quantity,
        price: variant.price,
      });
    }

    await this.cartRepo.save(owner, items);
    return this.buildDto(owner, items);
  }

  async updateItem(
    owner: CartOwner,
    productId: string,
    variantId: string,
    quantity: number,
  ): Promise<Cart> {
    const cart = await this.cartRepo.get(owner);
    const items = cart?.items ?? [];
    const idx = items.findIndex((i) => i.productId === productId && i.variantId === variantId);
    if (idx === -1) throw new CartError(404, 'Item not in cart');

    if (quantity <= 0) {
      items.splice(idx, 1);
    } else {
      const { variant } = await this.requireVariant(productId, variantId);
      if (quantity > variant.stock) {
        throw new CartError(409, `Only ${variant.stock} unit(s) in stock`);
      }
      items[idx].quantity = quantity;
      items[idx].price = variant.price;
    }

    await this.cartRepo.save(owner, items);
    return this.buildDto(owner, items);
  }

  async removeItem(owner: CartOwner, productId: string, variantId: string): Promise<Cart> {
    const cart = await this.cartRepo.get(owner);
    const items = (cart?.items ?? []).filter(
      (i) => !(i.productId === productId && i.variantId === variantId),
    );
    await this.cartRepo.save(owner, items);
    return this.buildDto(owner, items);
  }

  async clearCart(owner: CartOwner): Promise<void> {
    await this.cartRepo.clear(owner);
  }

  // Folds a guest cart into the authenticated user's cart. The guest lines come
  // from the server-side cart resolved via the `cartId` cookie when available;
  // otherwise we fall back to the lines the client passes explicitly, because
  // the httpOnly cookie is cross-origin and strict browsers can drop it on this
  // call — without the fallback the cart would silently vanish at login.
  async mergeGuestIntoUser(
    userId: string,
    source: { guestId?: string; items?: AddItemInput[] },
  ): Promise<Cart> {
    const userOwner: CartOwner = { type: 'user', id: userId };

    let incoming: CartItemEntity[] = [];
    if (source.guestId) {
      const guest = await this.cartRepo.get({ type: 'guest', id: source.guestId });
      if (guest && guest.items.length > 0) incoming = guest.items;
    }
    if (incoming.length === 0 && source.items?.length) {
      // price is a placeholder — clampToStock refreshes it from the live variant.
      incoming = source.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
        price: 0,
      }));
    }
    if (incoming.length === 0) return this.getCart(userOwner);

    const user = await this.cartRepo.get(userOwner);
    const items = user?.items ?? [];
    for (const gi of incoming) {
      const existing = items.find(
        (i) => i.productId === gi.productId && i.variantId === gi.variantId,
      );
      if (existing) existing.quantity += gi.quantity;
      else items.push({ ...gi });
    }

    const clamped = await this.clampToStock(items);
    await this.cartRepo.save(userOwner, clamped);
    if (source.guestId) await this.cartRepo.clear({ type: 'guest', id: source.guestId });
    return this.buildDto(userOwner, clamped);
  }

  private async requireVariant(
    productId: string,
    variantId: string,
  ): Promise<{ product: ProductEntity; variant: ProductVariantEntity }> {
    const product = await this.productRepo.findById(productId);
    if (!product || !product.isActive) throw new CartError(404, 'Product not found');
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) throw new CartError(404, 'Variant not found');
    return { product, variant };
  }

  private async clampToStock(items: CartItemEntity[]): Promise<CartItemEntity[]> {
    const result: CartItemEntity[] = [];
    for (const it of items) {
      const product = await this.productRepo.findById(it.productId);
      const variant = product?.variants.find((v) => v.id === it.variantId);
      if (!product || !product.isActive || !variant) continue;
      const qty = Math.min(it.quantity, variant.stock);
      if (qty > 0) result.push({ ...it, quantity: qty, price: variant.price });
    }
    return result;
  }

  private async buildDto(owner: CartOwner, items: CartItemEntity[]): Promise<Cart> {
    const enriched: CartItem[] = [];
    let totalAmount = 0;
    let totalItems = 0;

    for (const it of items) {
      const product = await this.productRepo.findById(it.productId);
      const variant = product?.variants.find((v) => v.id === it.variantId);
      const price = variant?.price ?? it.price;
      const lineTotal = Math.round(price * it.quantity * 100) / 100;
      totalAmount += lineTotal;
      totalItems += it.quantity;
      enriched.push({
        productId: it.productId,
        variantId: it.variantId,
        quantity: it.quantity,
        price,
        productName: product?.name,
        productSlug: product?.slug,
        image: product?.images[0] ?? variant?.images[0],
        variantName: variant?.name,
        inStock: variant ? variant.stock > 0 : false,
        maxStock: variant?.stock,
        lineTotal,
      });
    }

    const now = new Date().toISOString();
    return {
      _id: owner.type === 'user' ? owner.id : `guest:${owner.id}`,
      userId: owner.type === 'user' ? owner.id : '',
      items: enriched,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalItems,
      createdAt: now,
      updatedAt: now,
    };
  }
}

export class CartError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, CartError.prototype);
  }
}
