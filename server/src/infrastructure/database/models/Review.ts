import mongoose, { Schema, Document } from 'mongoose';

export interface ReviewDocument extends Document {
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  sellerResponse?: {
    comment: string;
    respondedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<ReviewDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    rating: { type: Number, required: true, min: 1, max: 5, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    comment: { type: String, required: true, trim: true, maxlength: 5000 },
    images: { type: [String], default: [] },
    sellerResponse: {
      comment: String,
      respondedAt: Date,
    },
  },
  { timestamps: true },
);

// One review per (user, order, product) — guarded at write time (cart-orders branch)
reviewSchema.index({ userId: 1, productId: 1, orderId: 1 }, { unique: true });

export const ReviewModel = mongoose.model<ReviewDocument>('Review', reviewSchema);
