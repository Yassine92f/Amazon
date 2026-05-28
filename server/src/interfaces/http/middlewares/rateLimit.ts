import rateLimit from 'express-rate-limit';
import { config } from '../../../config';

const disabled = config.env === 'test';

export const authStrictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => disabled,
  message: {
    success: false,
    message: 'Too many attempts. Try again in 15 minutes.',
  },
});

export const authLooseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => disabled,
  message: {
    success: false,
    message: 'Too many requests. Try again later.',
  },
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => disabled,
  message: {
    success: false,
    message: 'Too many reset requests. Try again in one hour.',
  },
});
