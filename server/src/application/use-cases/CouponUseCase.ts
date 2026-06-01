import { CouponValidation } from '@ecommerce/shared';
import { ICouponRepository } from '../../domain/repositories/ICouponRepository';
import { CouponEntity } from '../../domain/entities/Coupon';

export interface CouponEvaluation {
  coupon: CouponEntity | null;
  discount: number;
  validation: CouponValidation;
}

export class CouponUseCase {
  constructor(private couponRepo: ICouponRepository) {}

  async validate(code: string, subtotal: number): Promise<CouponValidation> {
    const { validation } = await this.evaluate(code, subtotal);
    return validation;
  }

  async evaluate(code: string, subtotal: number): Promise<CouponEvaluation> {
    const normalized = code.toUpperCase().trim();
    const invalid = (message: string): CouponEvaluation => ({
      coupon: null,
      discount: 0,
      validation: {
        valid: false,
        code: normalized,
        discountType: 'fixed',
        discountValue: 0,
        discountedAmount: 0,
        message,
      },
    });

    const coupon = await this.couponRepo.findByCode(normalized);
    if (!coupon || !coupon.isActive) return invalid('Code promo invalide');
    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
      return invalid('Code promo expiré');
    }
    if (coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit) {
      return invalid('Code promo épuisé');
    }
    if (coupon.minOrderAmount !== undefined && subtotal < coupon.minOrderAmount) {
      return invalid(`Montant minimum de ${coupon.minOrderAmount}€ requis`);
    }

    const discount = this.computeDiscount(coupon, subtotal);
    return {
      coupon,
      discount,
      validation: {
        valid: true,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountedAmount: discount,
      },
    };
  }

  async markUsed(couponId: string): Promise<void> {
    await this.couponRepo.incrementUsage(couponId);
  }

  private computeDiscount(coupon: CouponEntity, subtotal: number): number {
    let discount =
      coupon.discountType === 'percentage'
        ? subtotal * (coupon.discountValue / 100)
        : coupon.discountValue;
    if (coupon.maxDiscount !== undefined) discount = Math.min(discount, coupon.maxDiscount);
    discount = Math.min(discount, subtotal);
    return Math.round(discount * 100) / 100;
  }
}

export class CouponError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, CouponError.prototype);
  }
}
