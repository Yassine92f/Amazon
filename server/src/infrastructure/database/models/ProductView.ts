import mongoose, { Schema, Document } from 'mongoose';

export interface ProductViewDocument extends Document {
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  viewedAt: Date;
}

const productViewSchema = new Schema<ProductViewDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  viewedAt: { type: Date, default: Date.now },
});

// One row per (user, product): re-viewing refreshes viewedAt instead of piling
// up duplicates. The descending viewedAt supports "most recent views" queries.
productViewSchema.index({ userId: 1, productId: 1 }, { unique: true });
productViewSchema.index({ userId: 1, viewedAt: -1 });

export const ProductViewModel = mongoose.model<ProductViewDocument>(
  'ProductView',
  productViewSchema,
);
