import { z } from 'zod';

const variantSchema = z.object({
  name: z.string().min(1).max(60).trim(),
  sku: z.string().min(1).max(40).trim(),
  price: z.number().positive('Price must be positive'),
  compareAtPrice: z.number().positive().optional(),
  stock: z.number().int().min(0),
  attributes: z.record(z.string()).optional(),
  images: z.array(z.string().url()).max(10).optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(2).max(140).trim(),
  description: z.string().min(10).max(5000).trim(),
  categoryId: z.string().length(24, 'Invalid category id'),
  brand: z.string().max(60).trim().optional(),
  tags: z.array(z.string().min(1).max(30)).max(20).optional(),
  variants: z.array(variantSchema).min(1, 'At least one variant is required').max(50),
  images: z.array(z.string().url()).min(1, 'At least one product image is required').max(10),
});

export const updateProductSchema = z
  .object({
    name: z.string().min(2).max(140).trim().optional(),
    description: z.string().min(10).max(5000).trim().optional(),
    categoryId: z.string().length(24).optional(),
    brand: z.string().max(60).trim().optional(),
    tags: z.array(z.string().min(1).max(30)).max(20).optional(),
    variants: z.array(variantSchema).min(1).max(50).optional(),
    images: z.array(z.string().url()).min(1).max(10).optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field is required' });

export const replyToReviewSchema = z.object({
  comment: z.string().min(2, 'Reply must be at least 2 characters').max(2000).trim(),
});
