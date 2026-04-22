export type CouponDiscountType = 'percentage' | 'fixed';

export interface CouponEntity {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  expiresAt?: Date;
  usageLimit?: number;
  // Max times a single user may redeem this coupon (undefined = unlimited).
  perUserLimit?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
