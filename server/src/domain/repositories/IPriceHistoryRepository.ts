import { PriceHistoryEntity } from '../entities/PriceHistory';

export interface RecordPriceData {
  productId: string;
  variantId: string;
  price: number;
  recordedAt?: Date;
}

export interface PriceHistoryQuery {
  productId: string;
  variantId?: string;
  from: Date;
  to: Date;
}

export interface IPriceHistoryRepository {
  // Append a single price observation. Implementations should de-duplicate
  // back-to-back identical prices for the same variant to keep the series
  // compact (price unchanged → nothing new to remember).
  recordPrice(data: RecordPriceData): Promise<PriceHistoryEntity | null>;
  // Bulk variant of recordPrice — used when a product update touches several
  // variants at once.
  recordPrices(data: RecordPriceData[]): Promise<PriceHistoryEntity[]>;
  // Ordered entries (oldest first) within [from, to]. When variantId is set,
  // scope to that variant only; otherwise return the product-wide series.
  findInRange(query: PriceHistoryQuery): Promise<PriceHistoryEntity[]>;
  // Minimum price ever recorded for the scope (variant if given, else product).
  // Returns null when no price has ever been recorded.
  findLowestEver(productId: string, variantId?: string): Promise<number | null>;
  // Most recent price observation for the scope (variant or product).
  findLatest(productId: string, variantId?: string): Promise<PriceHistoryEntity | null>;
  // Cleanup helper — used when a product is deleted.
  deleteByProduct(productId: string): Promise<void>;
}
