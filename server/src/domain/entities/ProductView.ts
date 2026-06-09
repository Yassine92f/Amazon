/**
 * A single "product viewed by a user" event. Used as a behavioral signal by the
 * recommendation engine (a viewed product hints at interest, weaker than a
 * purchase but stronger than nothing).
 */
export interface ProductViewEntity {
  id: string;
  userId: string;
  productId: string;
  viewedAt: Date;
}
