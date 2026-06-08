import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { TokenService } from '../../../infrastructure/services/TokenService';
import { CartOwner } from '../../../domain/entities/Cart';

export interface CartRequest extends Request {
  cartOwner: CartOwner;
  userId?: string;
  userRole?: string;
}

const tokenService = new TokenService();
const GUEST_COOKIE = 'cartId';
const GUEST_COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // 7 days

// Resolves the cart owner for a request: an authenticated user when a valid
// access token is present, otherwise a guest identified by a persistent cookie.
export function cartContext(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = tokenService.verifyAccessToken(header.split(' ')[1] as string);
      (req as CartRequest).userId = payload.userId;
      (req as CartRequest).userRole = payload.role;
      (req as CartRequest).cartOwner = { type: 'user', id: payload.userId };
      return next();
    } catch {
      // Invalid/expired token — fall back to a guest cart instead of failing.
    }
  }

  let cartId = (req.cookies?.[GUEST_COOKIE] as string | undefined) ?? undefined;
  if (!cartId) {
    cartId = crypto.randomUUID();
    res.cookie(GUEST_COOKIE, cartId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: GUEST_COOKIE_MAX_AGE,
    });
  }
  (req as CartRequest).cartOwner = { type: 'guest', id: cartId };
  next();
}
