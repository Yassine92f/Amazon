import mongoose, { Schema, Document } from 'mongoose';
import { PaymentStatus, PaymentMethod } from '@ecommerce/shared';

export interface PaymentDocument extends Document {
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  stripePaymentIntentId: string;
  stripeCustomerId?: string;
  refundedAmount?: number;
  failureReason?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<PaymentDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'eur' },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true,
    },
    method: {
      type: String,
      enum: Object.values(PaymentMethod),
      default: PaymentMethod.CARD,
    },
    stripePaymentIntentId: { type: String, required: true, unique: true, index: true },
    stripeCustomerId: { type: String },
    refundedAmount: { type: Number, min: 0 },
    failureReason: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true },
);

export const PaymentModel = mongoose.model<PaymentDocument>('Payment', paymentSchema);
