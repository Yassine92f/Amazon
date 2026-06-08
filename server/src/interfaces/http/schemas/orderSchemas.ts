import { z } from 'zod';
import { DeliveryType, OrderStatus } from '@ecommerce/shared';

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().length(24, 'Invalid product id'),
        variantId: z.string().length(24, 'Invalid variant id'),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1, 'Order must contain at least one item')
    .max(50),
  deliveryType: z.nativeEnum(DeliveryType),
  shippingAddressId: z.string().length(24, 'Invalid address id'),
  couponCode: z.string().min(1).max(40).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export const validateCouponSchema = z.object({
  code: z.string().min(1).max(40),
  subtotal: z.number().min(0),
});
