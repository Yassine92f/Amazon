import {
  CreatePaymentIntentResponse,
  PaymentStatus,
  PaymentMethod,
  OrderStatus,
  RefundRequest,
  UserRole,
} from '@ecommerce/shared';
import { IPaymentService } from '../../domain/services/IPaymentService';
import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository';

const CURRENCY = 'eur';

export class PaymentUseCase {
  constructor(
    private paymentService: IPaymentService,
    private paymentRepo: IPaymentRepository,
    private orderRepo: IOrderRepository,
  ) {}

  // Creates (or refreshes) a Stripe PaymentIntent for a pending order owned by the user.
  async createIntent(userId: string, orderId: string): Promise<CreatePaymentIntentResponse> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new PaymentError(404, 'Order not found');
    if (order.userId !== userId) throw new PaymentError(403, 'You cannot pay for this order');
    if (order.status !== OrderStatus.PENDING) {
      throw new PaymentError(400, 'This order is not awaiting payment');
    }

    const amount = Math.round(order.totalAmount * 100);
    const intent = await this.paymentService.createPaymentIntent({
      amount,
      currency: CURRENCY,
      metadata: { orderId: order.id, userId },
    });

    const existing = await this.paymentRepo.findByOrderId(order.id);
    if (existing) {
      await this.paymentRepo.updateById(existing.id, {
        status: PaymentStatus.PROCESSING,
        stripePaymentIntentId: intent.id,
        failureReason: undefined,
      });
    } else {
      await this.paymentRepo.create({
        orderId: order.id,
        userId,
        amount: order.totalAmount,
        currency: CURRENCY,
        status: PaymentStatus.PROCESSING,
        method: PaymentMethod.CARD,
        stripePaymentIntentId: intent.id,
      });
    }

    await this.orderRepo.updateById(order.id, { paymentIntentId: intent.id });

    return { clientSecret: intent.clientSecret, paymentIntentId: intent.id };
  }

  // Deterministic confirmation: the client calls this right after Stripe reports
  // the payment succeeded, so the order is confirmed immediately instead of
  // waiting on the (possibly undelivered, in local dev) webhook. The webhook
  // remains the authoritative async backup; both go through the idempotent
  // markPaid path.
  async confirmPayment(
    userId: string,
    orderId: string,
  ): Promise<{ status: OrderStatus; paid: boolean }> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new PaymentError(404, 'Order not found');
    if (order.userId !== userId) throw new PaymentError(403, 'You cannot confirm this order');
    if (order.status !== OrderStatus.PENDING) {
      return { status: order.status, paid: true };
    }

    const payment = await this.paymentRepo.findByOrderId(order.id);
    if (!payment) throw new PaymentError(404, 'No payment found for this order');

    const intent = await this.paymentService.retrievePaymentIntent(payment.stripePaymentIntentId);
    if (intent.status === 'succeeded') {
      await this.markPaid(intent.id);
    }

    const updated = await this.orderRepo.findById(orderId);
    const status = updated?.status ?? order.status;
    return { status, paid: status !== OrderStatus.PENDING };
  }

  async handleWebhook(payload: Buffer, signature: string): Promise<{ received: boolean }> {
    let event;
    try {
      event = this.paymentService.constructEvent(payload, signature);
    } catch {
      throw new PaymentError(400, 'Invalid webhook signature');
    }

    const object = event.data.object;
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.markPaid(String(object.id));
        break;
      case 'payment_intent.payment_failed':
        await this.markFailed(String(object.id), this.extractFailureReason(object));
        break;
      case 'charge.refunded':
        await this.markRefunded(
          String(object.payment_intent),
          Number(object.amount_refunded) / 100,
          Number(object.amount_refunded) >= Number(object.amount),
        );
        break;
      default:
        break;
    }

    return { received: true };
  }

  async refund(role: string, dto: RefundRequest): Promise<{ refundedAmount: number }> {
    if (role !== UserRole.ADMIN) throw new PaymentError(403, 'Only admins can issue refunds');

    const payment = await this.paymentRepo.findById(dto.paymentId);
    if (!payment) throw new PaymentError(404, 'Payment not found');
    if (
      payment.status !== PaymentStatus.SUCCEEDED &&
      payment.status !== PaymentStatus.PARTIALLY_REFUNDED
    ) {
      throw new PaymentError(400, 'Only a succeeded payment can be refunded');
    }
    if (dto.amount !== undefined && (dto.amount <= 0 || dto.amount > payment.amount)) {
      throw new PaymentError(400, 'Invalid refund amount');
    }

    const amountCents = dto.amount !== undefined ? Math.round(dto.amount * 100) : undefined;
    const result = await this.paymentService.refund(payment.stripePaymentIntentId, amountCents);
    // The charge.refunded webhook reconciles the final state; update optimistically here.
    const refundedAmount = result.amount / 100;
    const isFull = refundedAmount >= payment.amount;
    await this.paymentRepo.updateById(payment.id, {
      status: isFull ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
      refundedAmount,
    });
    if (isFull) {
      await this.orderRepo.updateById(payment.orderId, { status: OrderStatus.REFUNDED });
    }

    return { refundedAmount };
  }

  private async markPaid(paymentIntentId: string): Promise<void> {
    const payment = await this.paymentRepo.findByPaymentIntentId(paymentIntentId);
    if (!payment) return;
    if (payment.status === PaymentStatus.SUCCEEDED) return; // idempotent

    const paidAt = new Date();
    await this.paymentRepo.updateById(payment.id, { status: PaymentStatus.SUCCEEDED, paidAt });

    const order = await this.orderRepo.findById(payment.orderId);
    if (order && order.status === OrderStatus.PENDING) {
      await this.orderRepo.updateById(order.id, {
        status: OrderStatus.CONFIRMED,
        paymentIntentId,
        paidAt,
      });
    }
  }

  private async markFailed(paymentIntentId: string, reason: string): Promise<void> {
    const payment = await this.paymentRepo.findByPaymentIntentId(paymentIntentId);
    if (!payment) return;
    await this.paymentRepo.updateById(payment.id, {
      status: PaymentStatus.FAILED,
      failureReason: reason,
    });
  }

  private async markRefunded(
    paymentIntentId: string,
    refundedAmount: number,
    isFull: boolean,
  ): Promise<void> {
    const payment = await this.paymentRepo.findByPaymentIntentId(paymentIntentId);
    if (!payment) return;
    await this.paymentRepo.updateById(payment.id, {
      status: isFull ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
      refundedAmount,
    });
    if (isFull) {
      await this.orderRepo.updateById(payment.orderId, { status: OrderStatus.REFUNDED });
    }
  }

  private extractFailureReason(object: Record<string, unknown>): string {
    const lastError = object.last_payment_error as { message?: string } | undefined;
    return lastError?.message ?? 'Payment failed';
  }
}

export class PaymentError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, PaymentError.prototype);
  }
}
