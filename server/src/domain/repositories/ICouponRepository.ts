import { CouponEntity } from '../entities/Coupon';

export interface ICouponRepository {
  findByCode(code: string): Promise<CouponEntity | null>;
  incrementUsage(id: string): Promise<void>;
}
