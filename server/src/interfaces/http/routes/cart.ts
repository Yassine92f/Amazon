import { Router, type IRouter } from 'express';
import { CartController } from '../controllers/CartController';
import { CartUseCase } from '../../../application/use-cases/CartUseCase';
import { CartRepository } from '../../../infrastructure/repositories/CartRepository';
import { ProductRepository } from '../../../infrastructure/repositories/ProductRepository';
import { authenticate } from '../middlewares/auth';
import { cartContext } from '../middlewares/cartContext';
import { validate } from '../middlewares/validate';
import { addCartItemSchema, updateCartItemSchema, mergeCartSchema } from '../schemas/cartSchemas';

const cartRepository = new CartRepository();
const productRepository = new ProductRepository();
const cartUseCase = new CartUseCase(cartRepository, productRepository);
const cartController = new CartController(cartUseCase);

const router: IRouter = Router();

// Merge guest cart into the user cart (must be authenticated) — declared before
// the generic cartContext routes.
router.post('/merge', authenticate, validate(mergeCartSchema), cartController.merge);

// Cart operations work for both guests (cookie) and authenticated users.
router.get('/', cartContext, cartController.get);
router.post('/items', cartContext, validate(addCartItemSchema), cartController.addItem);
router.put(
  '/items/:productId/:variantId',
  cartContext,
  validate(updateCartItemSchema),
  cartController.updateItem,
);
router.delete('/items/:productId/:variantId', cartContext, cartController.removeItem);
router.delete('/', cartContext, cartController.clear);

export default router;
