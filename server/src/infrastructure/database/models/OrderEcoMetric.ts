import mongoose, { Schema, Document } from 'mongoose';
import { EcoDeliveryOptionIdEntity } from '../../../domain/entities/EcoDeliveryOption';

export interface OrderEcoMetricDocument extends Document {
  orderId: mongoose.Types.ObjectId;
  optionId: EcoDeliveryOptionIdEntity;
  co2EmittedKg: number;
  co2SavedKg: number;
  treeDonationCents: number;
  treesPlanted: number;
  recordedAt: Date;
}

const orderEcoMetricSchema = new Schema<OrderEcoMetricDocument>(
  {
    // Unique index: one eco-metric row per order. Re-choosing an option does
    // an upsert (see repository), so we never end up with two rows for the
    // same order.
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    optionId: {
      type: String,
      required: true,
      enum: Object.values(EcoDeliveryOptionIdEntity),
    },
    co2EmittedKg: { type: Number, required: true, min: 0 },
    co2SavedKg: { type: Number, required: true, min: 0 },
    treeDonationCents: { type: Number, required: true, min: 0, default: 0 },
    treesPlanted: { type: Number, required: true, min: 0, default: 0 },
    recordedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: false, versionKey: false },
);

export const OrderEcoMetricModel = mongoose.model<OrderEcoMetricDocument>(
  'OrderEcoMetric',
  orderEcoMetricSchema,
);
