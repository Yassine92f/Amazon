import { z } from 'zod';

export const createPaymentIntentSchema = z.object({
  orderId: z.string().length(24, 'Invalid order id'),
});

export const refundSchema = z.object({
  paymentId: z.string().length(24, 'Invalid payment id'),
  amount: z.number().positive().optional(),
  reason: z.string().max(500).optional(),
});
