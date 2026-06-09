import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@ecommerce/shared';
import { TokenService } from '../../../infrastructure/services/TokenService';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  userId: string;
  userRole: string;
  userEmail: string;
}

const tokenService = new TokenService();

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Missing access token'));
  }

  const token = header.split(' ')[1];

  try {
    const payload = tokenService.verifyAccessToken(token);
    (req as AuthRequest).userId = payload.userId;
    (req as AuthRequest).userRole = payload.role;
    (req as AuthRequest).userEmail = payload.email;
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token'));
  }
}

/**
 * Attaches the user to the request when a valid token is present, but never
 * rejects: anonymous requests pass through with no user set. Used by endpoints
 * that personalize their response when logged in but also serve guests.
 */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();

  try {
    const payload = tokenService.verifyAccessToken(header.split(' ')[1]);
    (req as AuthRequest).userId = payload.userId;
    (req as AuthRequest).userRole = payload.role;
    (req as AuthRequest).userEmail = payload.email;
  } catch {
    // Ignore an invalid/expired token and continue as a guest.
  }
  next();
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const userRole = (req as AuthRequest).userRole;
    if (!roles.includes(userRole as UserRole)) {
      return next(new AppError(403, 'Forbidden'));
    }
    next();
  };
}
