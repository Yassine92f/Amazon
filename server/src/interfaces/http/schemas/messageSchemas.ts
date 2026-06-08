import { z } from 'zod';

export const startConversationSchema = z.object({
  userId: z.string().length(24, 'Invalid user id'),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message vide').max(4000),
});
