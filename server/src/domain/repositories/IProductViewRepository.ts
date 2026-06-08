export interface RecentView {
  productId: string;
  viewedAt: Date;
}

export interface IProductViewRepository {
  /** Record that a user viewed a product (upserts the timestamp if seen before). */
  record(userId: string, productId: string): Promise<void>;
  /**
   * Most recently viewed products for a user, newest first, de-duplicated by
   * product. Limited to keep the behavioral window small and recent.
   */
  findRecentByUser(userId: string, limit: number): Promise<RecentView[]>;
}
