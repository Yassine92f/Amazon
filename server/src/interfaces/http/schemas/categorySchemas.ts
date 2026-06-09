import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(80).trim(),
  description: z.string().max(500).trim().optional(),
  parentId: z.string().length(24, 'Invalid parent id').optional(),
  image: z.string().url().optional(),
  icon: z.string().max(40).optional(),
  slug: z
    .string()
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase, digits and hyphens')
    .optional(),
});

export const updateCategorySchema = z
  .object({
    name: z.string().min(1).max(80).trim().optional(),
    description: z.string().max(500).trim().optional(),
    parentId: z.string().length(24).nullable().optional(),
    image: z.string().url().optional(),
    icon: z.string().max(40).optional(),
    slug: z
      .string()
      .max(80)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field is required' });
