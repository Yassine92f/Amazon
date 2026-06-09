import { z } from 'zod';
import { DisputeReason, DisputeStatus } from '@ecommerce/shared';

export const createDisputeSchema = z.object({
  orderId: z.string().length(24, 'Invalid order id'),
  reason: z.nativeEnum(DisputeReason),
  description: z
    .string()
    .min(10, 'Please describe the problem (10 characters min)')
    .max(2000)
    .trim(),
});

export const resolveDisputeSchema = z.object({
  status: z.enum([DisputeStatus.UNDER_REVIEW, DisputeStatus.RESOLVED, DisputeStatus.REJECTED]),
  resolution: z.string().max(2000).trim().optional(),
});
