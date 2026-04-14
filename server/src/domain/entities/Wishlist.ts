export interface WishlistItemEntity {
  productId: string;
  addedAt: Date;
}

export interface WishlistEntity {
  id: string;
  userId: string;
  items: WishlistItemEntity[];
  createdAt: Date;
  updatedAt: Date;
}
