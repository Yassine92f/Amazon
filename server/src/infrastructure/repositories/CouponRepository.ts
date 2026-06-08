import mongoose from 'mongoose';
import {
  ICouponRepository,
  CreateCouponData,
  UpdateCouponData,
  CouponListResult,
} from '../../domain/repositories/ICouponRepository';
import { CouponEntity } from '../../domain/entities/Coupon';
import { CouponModel, CouponDocument, CouponRedemptionModel } from '../database/models/Coupon';

export class CouponRepository implements ICouponRepository {
  async findByCode(code: string): Promise<CouponEntity | null> {
    const doc = await CouponModel.findOne({ code: code.toUpperCase().trim() });
    return doc ? this.toEntity(doc) : null;
  }

  async create(data: CreateCouponData): Promise<CouponEntity> {
    const doc = await CouponModel.create({ ...data, code: data.code.toUpperCase().trim() });
    return this.toEntity(doc);
  }

  async findById(id: string): Promise<CouponEntity | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await CouponModel.findById(id);
    return doc ? this.toEntity(doc) : null;
  }

  async findMany(page: number, limit: number): Promise<CouponListResult> {
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      CouponModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      CouponModel.countDocuments(),
    ]);
    return { coupons: docs.map((d) => this.toEntity(d)), total };
  }

  async updateById(id: string, data: UpdateCouponData): Promise<CouponEntity | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    // Translate `null` (clear) vs `undefined` (leave) into $set / $unset.
    const set: Record<string, unknown> = {};
    const unset: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      if (value === null) unset[key] = '';
      else set[key] = value;
    }
    const update: Record<string, unknown> = {};
    if (Object.keys(set).length) update.$set = set;
    if (Object.keys(unset).length) update.$unset = unset;
    const doc = await CouponModel.findByIdAndUpdate(id, update, { new: true });
    return doc ? this.toEntity(doc) : null;
  }

  async deleteById(id: string): Promise<void> {
    if (!mongoose.isValidObjectId(id)) return;
    await CouponModel.findByIdAndDelete(id);
  }

  async codeExists(code: string): Promise<boolean> {
    const doc = await CouponModel.exists({ code: code.toUpperCase().trim() });
    return doc !== null;
  }

  async countUserRedemptions(couponId: string, userId: string): Promise<number> {
    if (!mongoose.isValidObjectId(couponId) || !mongoose.isValidObjectId(userId)) return 0;
    return CouponRedemptionModel.countDocuments({ couponId, userId });
  }

  async recordRedemption(couponId: string, userId: string, orderId: string): Promise<void> {
    if (
      !mongoose.isValidObjectId(couponId) ||
      !mongoose.isValidObjectId(userId) ||
      !mongoose.isValidObjectId(orderId)
    ) {
      return;
    }
    await CouponRedemptionModel.create({ couponId, userId, orderId });
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
      perUserLimit: doc.perUserLimit,
      usedCount: doc.usedCount,
      isActive: doc.isActive,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
