import mongoose, { Schema, Document } from 'mongoose';
import { DisputeStatus, DisputeReason } from '@ecommerce/shared';

export interface DisputeDocument extends Document {
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  reason: DisputeReason;
  description: string;
  status: DisputeStatus;
  resolution?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const disputeSchema = new Schema<DisputeDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reason: { type: String, enum: Object.values(DisputeReason), required: true },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: Object.values(DisputeStatus),
      default: DisputeStatus.OPEN,
      index: true,
    },
    resolution: { type: String, trim: true, maxlength: 2000 },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
);

export const DisputeModel = mongoose.model<DisputeDocument>('Dispute', disputeSchema);
