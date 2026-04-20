export interface CreatePaymentIntentParams {
  amount: number; // in the smallest currency unit (e.g. cents)
  currency: string;
  metadata: Record<string, string>;
}

export interface PaymentIntentResult {
  id: string;
  clientSecret: string;
}

export interface RefundResult {
  id: string;
  status: string;
  amount: number; // in the smallest currency unit
}

export interface PaymentWebhookEvent {
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

export interface PaymentIntentStatus {
  id: string;
  status: string; // Stripe PaymentIntent status, e.g. 'succeeded', 'processing'
}

export interface IPaymentService {
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult>;
  // Reads the live PaymentIntent status from Stripe (used to confirm an order
  // deterministically, without waiting for the async webhook).
  retrievePaymentIntent(id: string): Promise<PaymentIntentStatus>;
  refund(paymentIntentId: string, amount?: number): Promise<RefundResult>;
  // Verifies the Stripe signature and returns the parsed event. Throws on invalid signature.
  constructEvent(payload: Buffer, signature: string): PaymentWebhookEvent;
}
