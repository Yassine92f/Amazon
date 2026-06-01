export interface CartItemEntity {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
}

export type CartOwnerType = 'user' | 'guest';

export interface CartOwner {
  type: CartOwnerType;
  id: string;
}

export interface CartEntity {
  owner: CartOwner;
  items: CartItemEntity[];
  updatedAt?: Date;
}
