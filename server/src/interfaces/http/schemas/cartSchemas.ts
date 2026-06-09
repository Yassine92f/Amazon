import { z } from 'zod';

export const addCartItemSchema = z.object({
  productId: z.string().length(24, 'Invalid product id'),
  variantId: z.string().length(24, 'Invalid variant id'),
  quantity: z.number().int().min(1).max(99),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(99),
});

// Body for POST /cart/merge. The guest cart is normally resolved from the
// httpOnly `cartId` cookie, but the client also sends the lines it holds as a
// fallback for browsers that drop the cross-origin cookie on this call.
export const mergeCartSchema = z.object({
  items: z.array(addCartItemSchema).max(99).optional(),
});
