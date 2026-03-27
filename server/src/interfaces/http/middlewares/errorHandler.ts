import { Request, Response, NextFunction } from 'express';
import { config } from '../../../config';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  console.error('Unhandled error:', err);

  return res.status(500).json({
    success: false,
    message: config.env === 'production' ? 'Internal server error' : err.message,
  });
}
