import { CouponEntity, CouponDiscountType } from '../entities/Coupon';

export interface CreateCouponData {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  expiresAt?: Date;
  usageLimit?: number;
  perUserLimit?: number;
  isActive?: boolean;
}

// `null` clears an optional field; `undefined` leaves it unchanged.
export interface UpdateCouponData {
  discountType?: CouponDiscountType;
  discountValue?: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  expiresAt?: Date | null;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  isActive?: boolean;
}

export interface CouponListResult {
  coupons: CouponEntity[];
  total: number;
}

export interface ICouponRepository {
  findByCode(code: string): Promise<CouponEntity | null>;
  incrementUsage(id: string): Promise<void>;
  // Per-user redemption tracking (enforces perUserLimit).
  countUserRedemptions(couponId: string, userId: string): Promise<number>;
  recordRedemption(couponId: string, userId: string, orderId: string): Promise<void>;
  // Admin CRUD
  create(data: CreateCouponData): Promise<CouponEntity>;
  findById(id: string): Promise<CouponEntity | null>;
  findMany(page: number, limit: number): Promise<CouponListResult>;
  updateById(id: string, data: UpdateCouponData): Promise<CouponEntity | null>;
  deleteById(id: string): Promise<void>;
  codeExists(code: string): Promise<boolean>;
}
