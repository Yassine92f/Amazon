import mongoose, { Schema, Document } from 'mongoose';

export interface PriceHistoryDocument extends Document {
  productId: mongoose.Types.ObjectId;
  variantId: mongoose.Types.ObjectId;
  price: number;
  recordedAt: Date;
}

const priceHistorySchema = new Schema<PriceHistoryDocument>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variantId: { type: Schema.Types.ObjectId, required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    recordedAt: { type: Date, required: true, default: () => new Date(), index: true },
  },
  { timestamps: false, versionKey: false },
);

// Compound index drives the most common access: ordered series for a given
// (product, variant) over a window.
priceHistorySchema.index({ productId: 1, variantId: 1, recordedAt: 1 });

export const PriceHistoryModel = mongoose.model<PriceHistoryDocument>(
  'PriceHistory',
  priceHistorySchema,
);
