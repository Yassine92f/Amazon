import { z } from 'zod';

export const addCartItemSchema = z.object({
  productId: z.string().length(24, 'Invalid product id'),
  variantId: z.string().length(24, 'Invalid variant id'),
  quantity: z.number().int().min(1).max(99),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(99),
});
