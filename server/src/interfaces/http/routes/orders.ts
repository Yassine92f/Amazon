import { Router, type IRouter } from 'express';
import { UserRole } from '@ecommerce/shared';
import { OrderController } from '../controllers/OrderController';
import { OrderUseCase } from '../../../application/use-cases/OrderUseCase';
import { CouponUseCase } from '../../../application/use-cases/CouponUseCase';
import { OrderRepository } from '../../../infrastructure/repositories/OrderRepository';
import { ProductRepository } from '../../../infrastructure/repositories/ProductRepository';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { CartRepository } from '../../../infrastructure/repositories/CartRepository';
import { CouponRepository } from '../../../infrastructure/repositories/CouponRepository';
import { SellerRepository } from '../../../infrastructure/repositories/SellerRepository';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createOrderSchema, updateOrderStatusSchema } from '../schemas/orderSchemas';

const orderRepository = new OrderRepository();
const productRepository = new ProductRepository();
const userRepository = new UserRepository();
const cartRepository = new CartRepository();
const couponRepository = new CouponRepository();
const sellerRepository = new SellerRepository();
const couponUseCase = new CouponUseCase(couponRepository);
const orderUseCase = new OrderUseCase(
  orderRepository,
  productRepository,
  userRepository,
  cartRepository,
  couponUseCase,
  sellerRepository,
);
const orderController = new OrderController(orderUseCase);

const router: IRouter = Router();

// All order routes require authentication.
router.use(authenticate);

router.post('/', validate(createOrderSchema), orderController.create);
router.get('/', orderController.list);
// Seller-scoped order list — must precede the `/:id` matcher.
router.get('/seller', authorize(UserRole.SELLER, UserRole.ADMIN), orderController.sellerList);
router.get('/:id', orderController.getOne);
router.patch(
  '/:id/status',
  authorize(UserRole.SELLER, UserRole.ADMIN),
  validate(updateOrderStatusSchema),
  orderController.updateStatus,
);
router.post('/:id/cancel', orderController.cancel);

export default router;
