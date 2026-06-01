import { z } from 'zod';

export const becomeSellerSchema = z.object({
  shopName: z.string().min(2, 'Shop name must be at least 2 characters').max(60).trim(),
  description: z.string().max(500).trim().default(''),
});

export const updateShopSchema = z
  .object({
    shopName: z.string().min(2).max(60).trim().optional(),
    description: z.string().max(500).trim().optional(),
    logo: z.string().url('Logo must be a valid URL').optional(),
    banner: z.string().url('Banner must be a valid URL').optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field is required' });

export const verifySellerSchema = z.object({
  isVerified: z.boolean(),
  commissionRate: z.number().min(0).max(1).optional(),
});
