import { CouponUseCase } from '../../src/application/use-cases/CouponUseCase';
import { buildCoupon, makeCouponRepo } from './helpers';

describe('CouponUseCase.validate', () => {
  it('rejects an unknown code', async () => {
    const useCase = new CouponUseCase(makeCouponRepo([]));
    const result = await useCase.validate('GHOST', 100);
    expect(result.valid).toBe(false);
  });

  it('rejects an inactive or expired coupon', async () => {
    const expired = buildCoupon({ code: 'OLD', expiresAt: new Date('2020-01-01') });
    const inactive = buildCoupon({ code: 'OFF', isActive: false });
    const useCase = new CouponUseCase(makeCouponRepo([expired, inactive]));
    expect((await useCase.validate('OLD', 100)).valid).toBe(false);
    expect((await useCase.validate('OFF', 100)).valid).toBe(false);
  });

  it('rejects when the minimum order amount is not met', async () => {
    const coupon = buildCoupon({ code: 'MIN50', minOrderAmount: 50 });
    const useCase = new CouponUseCase(makeCouponRepo([coupon]));
    const result = await useCase.validate('MIN50', 40);
    expect(result.valid).toBe(false);
  });

  it('rejects when the usage limit is reached', async () => {
    const coupon = buildCoupon({ code: 'ONCE', usageLimit: 1, usedCount: 1 });
    const useCase = new CouponUseCase(makeCouponRepo([coupon]));
    expect((await useCase.validate('ONCE', 100)).valid).toBe(false);
  });

  it('computes a percentage discount capped by maxDiscount', async () => {
    const coupon = buildCoupon({
      code: 'SAVE20',
      discountType: 'percentage',
      discountValue: 20,
      maxDiscount: 15,
    });
    const useCase = new CouponUseCase(makeCouponRepo([coupon]));
    const result = await useCase.validate('save20', 100); // 20 -> capped at 15
    expect(result.valid).toBe(true);
    expect(result.discountedAmount).toBe(15);
  });

  it('never lets a fixed discount exceed the subtotal', async () => {
    const coupon = buildCoupon({ code: 'FLAT30', discountType: 'fixed', discountValue: 30 });
    const useCase = new CouponUseCase(makeCouponRepo([coupon]));
    const result = await useCase.validate('FLAT30', 20);
    expect(result.discountedAmount).toBe(20);
  });
});
