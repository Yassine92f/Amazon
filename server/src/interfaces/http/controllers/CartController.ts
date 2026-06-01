import { Request, Response, NextFunction } from 'express';
import { CartUseCase, CartError } from '../../../application/use-cases/CartUseCase';
import { AppError } from '../middlewares/errorHandler';
import { CartRequest } from '../middlewares/cartContext';

export class CartController {
  constructor(private cartUseCase: CartUseCase) {}

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cart = await this.cartUseCase.getCart((req as CartRequest).cartOwner);
      res.json({ success: true, data: cart });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  addItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cart = await this.cartUseCase.addItem((req as CartRequest).cartOwner, req.body);
      res.status(201).json({ success: true, data: cart });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  updateItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cart = await this.cartUseCase.updateItem(
        (req as CartRequest).cartOwner,
        req.params.productId as string,
        req.params.variantId as string,
        req.body.quantity,
      );
      res.json({ success: true, data: cart });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  removeItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cart = await this.cartUseCase.removeItem(
        (req as CartRequest).cartOwner,
        req.params.productId as string,
        req.params.variantId as string,
      );
      res.json({ success: true, data: cart });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  clear = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.cartUseCase.clearCart((req as CartRequest).cartOwner);
      res.json({ success: true, message: 'Cart cleared' });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  // Merge the guest cart (identified by the cartId cookie) into the authenticated
  // user's cart. Called by the client right after login/register.
  merge = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as CartRequest).userId as string;
      const guestId = req.cookies?.cartId as string | undefined;
      const cart = guestId
        ? await this.cartUseCase.mergeGuestIntoUser(guestId, userId)
        : await this.cartUseCase.getCart({ type: 'user', id: userId });
      if (guestId) res.clearCookie('cartId');
      res.json({ success: true, data: cart });
    } catch (err) {
      next(this.mapError(err));
    }
  };

  private mapError(err: unknown): AppError | Error {
    if (err instanceof CartError) return new AppError(err.statusCode, err.message);
    if (err instanceof AppError) return err;
    return err as Error;
  }
}
