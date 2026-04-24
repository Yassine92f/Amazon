import { z } from 'zod';

export const createReviewSchema = z.object({
  productId: z.string().length(24, 'Invalid product id'),
  orderId: z.string().length(24, 'Invalid order id'),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3, 'Titre trop court').max(140),
  comment: z.string().min(10, 'Commentaire trop court').max(5000),
  images: z.array(z.string().url()).max(5).optional(),
});
