import { OrderEcoMetricEntity } from '../entities/OrderEcoMetric';

export interface IOrderEcoMetricRepository {
  // Upsert by orderId — re-choosing an option just overwrites the previous
  // record so we don't keep a stale series for a single order.
  upsert(metric: OrderEcoMetricEntity): Promise<OrderEcoMetricEntity>;
  findByOrderId(orderId: string): Promise<OrderEcoMetricEntity | null>;
  // Aggregate the buyer's lifetime savings — used by a future "My impact"
  // dashboard. Kept in the same repo so we have a single source of truth.
  sumSavedByOrderIds(orderIds: string[]): Promise<{ totalSavedKg: number; orderCount: number }>;
  // Platform-wide trees-planted counter — drives a public "X trees planted by
  // our community" callout. Public, no auth.
  countTreesPlanted(): Promise<{ totalTrees: number; totalDonationCents: number }>;
}
