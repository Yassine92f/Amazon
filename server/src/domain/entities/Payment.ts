import { PaymentStatus, PaymentMethod } from '@ecommerce/shared';

export interface PaymentEntity {
  id: string;
  orderId: string;
  userId: string;
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
