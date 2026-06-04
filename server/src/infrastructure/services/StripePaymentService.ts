import Stripe from 'stripe';
import { config } from '../../config';
import {
  IPaymentService,
  CreatePaymentIntentParams,
  PaymentIntentResult,
  RefundResult,
  PaymentWebhookEvent,
} from '../../domain/services/IPaymentService';

export class StripePaymentService implements IPaymentService {
  private stripe: Stripe;

  constructor() {
    if (!config.stripe.secretKey) {
      throw new Error(
        'STRIPE_SECRET_KEY is missing. Set it in the root .env file (see .env.example).',
      );
    }
    this.stripe = new Stripe(config.stripe.secretKey);
  }

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    const intent = await this.stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency,
      metadata: params.metadata,
      automatic_payment_methods: { enabled: true },
    });
    if (!intent.client_secret) {
      throw new Error('Stripe did not return a client secret');
    }
    return { id: intent.id, clientSecret: intent.client_secret };
  }

  async refund(paymentIntentId: string, amount?: number): Promise<RefundResult> {
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      ...(amount !== undefined ? { amount } : {}),
    });
    return { id: refund.id, status: refund.status ?? 'unknown', amount: refund.amount };
  }

  constructEvent(payload: Buffer, signature: string): PaymentWebhookEvent {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      config.stripe.webhookSecret,
    );
    return {
      type: event.type,
      data: { object: event.data.object as unknown as Record<string, unknown> },
    };
  }
}
