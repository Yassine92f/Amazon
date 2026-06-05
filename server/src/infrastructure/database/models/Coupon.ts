import mongoose, { Schema, Document } from 'mongoose';

export interface CouponDocument extends Document {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  expiresAt?: Date;
  usageLimit?: number;
  perUserLimit?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<CouponDocument>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, min: 0 },
    maxDiscount: { type: Number, min: 0 },
    expiresAt: { type: Date },
    usageLimit: { type: Number, min: 0 },
    perUserLimit: { type: Number, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const CouponModel = mongoose.model<CouponDocument>('Coupon', couponSchema);

// One document per (coupon, user, order) redemption — used to enforce perUserLimit.
export interface CouponRedemptionDocument extends Document {
  couponId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const couponRedemptionSchema = new Schema<CouponRedemptionDocument>(
  {
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

couponRedemptionSchema.index({ couponId: 1, userId: 1 });

export const CouponRedemptionModel = mongoose.model<CouponRedemptionDocument>(
  'CouponRedemption',
  couponRedemptionSchema,
);
