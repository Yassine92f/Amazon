import { ICouponRepository } from '../../domain/repositories/ICouponRepository';
import { CouponEntity } from '../../domain/entities/Coupon';
import { CouponModel, CouponDocument } from '../database/models/Coupon';

export class CouponRepository implements ICouponRepository {
  async findByCode(code: string): Promise<CouponEntity | null> {
    const doc = await CouponModel.findOne({ code: code.toUpperCase().trim() });
    return doc ? this.toEntity(doc) : null;
  }

  async incrementUsage(id: string): Promise<void> {
    // Atomic guard: only increment while still under the usage limit (when one is
    // set). Prevents concurrent orders from pushing usedCount past usageLimit.
    await CouponModel.updateOne(
      {
        _id: id,
        $or: [
          { usageLimit: { $exists: false } },
          { usageLimit: null },
          { $expr: { $lt: ['$usedCount', '$usageLimit'] } },
        ],
      },
      { $inc: { usedCount: 1 } },
    );
  }

  private toEntity(doc: CouponDocument): CouponEntity {
    return {
      id: (doc._id as { toString: () => string }).toString(),
      code: doc.code,
      discountType: doc.discountType,
      discountValue: doc.discountValue,
      minOrderAmount: doc.minOrderAmount,
      maxDiscount: doc.maxDiscount,
      expiresAt: doc.expiresAt,
      usageLimit: doc.usageLimit,
      usedCount: doc.usedCount,
      isActive: doc.isActive,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
