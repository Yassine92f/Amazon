import { Request, Response, NextFunction } from 'express';
import { PaymentUseCase, PaymentError } from '../../../application/use-cases/PaymentUseCase';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';

export class PaymentController {
  constructor(private paymentUseCase: PaymentUseCase) {}

  createIntent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthRequest;
      const result = await this.paymentUseCase.createIntent(userId, req.body.orderId);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  // Stripe webhook — receives the raw request body (configured in app.ts) and the
  // stripe-signature header. No auth: authenticity is proven by the signature.
  webhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = req.headers['stripe-signature'];
      if (typeof signature !== 'string') {
        throw new PaymentError(400, 'Missing Stripe signature');
      }
      const result = await this.paymentUseCase.handleWebhook(req.body as Buffer, signature);
      res.json(result);
    } catch (err) {
      next(this.mapError(err));
    }
  };

  refund = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userRole } = req as AuthRequest;
      const result = await this.paymentUseCase.refund(userRole, req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  private mapError(err: unknown): AppError | Error {
    if (err instanceof PaymentError) return new AppError(err.statusCode, err.message);
    if (err instanceof AppError) return err;
    return err as Error;
  }
}
