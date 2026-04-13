import { Router, type IRouter } from 'express';
import { UserRole } from '@ecommerce/shared';
import { SellerController } from '../controllers/SellerController';
import { SellerUseCase } from '../../../application/use-cases/SellerUseCase';
import { SellerRepository } from '../../../infrastructure/repositories/SellerRepository';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { becomeSellerSchema, updateShopSchema, verifySellerSchema } from '../schemas/sellerSchemas';

const sellerRepository = new SellerRepository();
const userRepository = new UserRepository();
const sellerUseCase = new SellerUseCase(sellerRepository, userRepository);
const sellerController = new SellerController(sellerUseCase);

const router: IRouter = Router();

// Public
router.get('/', sellerController.listSellers);
router.get('/:slug', sellerController.getPublicShop);

// Self (any authenticated user can register; subsequent endpoints require seller role)
router.post('/register', authenticate, validate(becomeSellerSchema), sellerController.becomeSeller);
router.get('/me/shop', authenticate, authorize(UserRole.SELLER), sellerController.getMyShop);
router.put(
  '/me/shop',
  authenticate,
  authorize(UserRole.SELLER),
  validate(updateShopSchema),
  sellerController.updateMyShop,
);

// Admin
router.put(
  '/:id/verify',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(verifySellerSchema),
  sellerController.verifySeller,
);

export default router;
