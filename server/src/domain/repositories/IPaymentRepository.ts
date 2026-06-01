import { PaymentStatus, PaymentMethod } from '@ecommerce/shared';
import { PaymentEntity } from '../entities/Payment';

export interface CreatePaymentData {
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  stripePaymentIntentId: string;
}

export interface UpdatePaymentData {
  status?: PaymentStatus;
  stripePaymentIntentId?: string;
  refundedAmount?: number;
  failureReason?: string;
  paidAt?: Date;
}

export interface IPaymentRepository {
  create(data: CreatePaymentData): Promise<PaymentEntity>;
  findById(id: string): Promise<PaymentEntity | null>;
  findByOrderId(orderId: string): Promise<PaymentEntity | null>;
  findByPaymentIntentId(paymentIntentId: string): Promise<PaymentEntity | null>;
  updateById(id: string, data: UpdatePaymentData): Promise<PaymentEntity | null>;
}
