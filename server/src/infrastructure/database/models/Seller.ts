import mongoose, { Schema, Document } from 'mongoose';

export interface SellerDocument extends Document {
  userId: mongoose.Types.ObjectId;
  shopName: string;
  shopSlug: string;
  description: string;
  logo?: string;
  banner?: string;
  rating: number;
  reviewCount: number;
  totalSales: number;
  totalRevenue: number;
  isVerified: boolean;
  commissionRate: number;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sellerSchema = new Schema<SellerDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    shopName: { type: String, required: true, trim: true, unique: true },
    shopSlug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: { type: String, required: true, trim: true, default: '' },
    logo: String,
    banner: String,
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    totalSales: { type: Number, default: 0, min: 0 },
    totalRevenue: { type: Number, default: 0, min: 0 },
    isVerified: { type: Boolean, default: false, index: true },
    commissionRate: { type: Number, default: 0.1, min: 0, max: 1 },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const SellerModel = mongoose.model<SellerDocument>('Seller', sellerSchema);
