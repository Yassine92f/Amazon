export interface PriceHistoryEntity {
  id: string;
  productId: string;
  variantId: string;
  price: number;
  recordedAt: Date;
}
