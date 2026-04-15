import mongoose from 'mongoose';
import {
  IPaymentRepository,
  CreatePaymentData,
  UpdatePaymentData,
} from '../../domain/repositories/IPaymentRepository';
import { PaymentEntity } from '../../domain/entities/Payment';
import { PaymentModel, PaymentDocument } from '../database/models/Payment';

export class PaymentRepository implements IPaymentRepository {
  async create(data: CreatePaymentData): Promise<PaymentEntity> {
    const doc = await PaymentModel.create({
      orderId: new mongoose.Types.ObjectId(data.orderId),
      userId: new mongoose.Types.ObjectId(data.userId),
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      method: data.method,
      stripePaymentIntentId: data.stripePaymentIntentId,
    });
    return this.toEntity(doc);
  }

  async findById(id: string): Promise<PaymentEntity | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await PaymentModel.findById(id);
    return doc ? this.toEntity(doc) : null;
  }

  async findByOrderId(orderId: string): Promise<PaymentEntity | null> {
    if (!mongoose.isValidObjectId(orderId)) return null;
    const doc = await PaymentModel.findOne({ orderId: new mongoose.Types.ObjectId(orderId) });
    return doc ? this.toEntity(doc) : null;
  }

  async findByPaymentIntentId(paymentIntentId: string): Promise<PaymentEntity | null> {
    const doc = await PaymentModel.findOne({ stripePaymentIntentId: paymentIntentId });
    return doc ? this.toEntity(doc) : null;
  }

  async updateById(id: string, data: UpdatePaymentData): Promise<PaymentEntity | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await PaymentModel.findByIdAndUpdate(id, data, { new: true });
    return doc ? this.toEntity(doc) : null;
  }

  private toEntity(doc: PaymentDocument): PaymentEntity {
    return {
      id: (doc._id as { toString: () => string }).toString(),
      orderId: doc.orderId.toString(),
      userId: doc.userId.toString(),
      amount: doc.amount,
      currency: doc.currency,
      status: doc.status,
      method: doc.method,
      stripePaymentIntentId: doc.stripePaymentIntentId,
      stripeCustomerId: doc.stripeCustomerId,
      refundedAmount: doc.refundedAmount,
      failureReason: doc.failureReason,
      paidAt: doc.paidAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
