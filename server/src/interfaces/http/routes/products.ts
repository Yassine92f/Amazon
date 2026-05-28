import { Router, type IRouter } from 'express';
import { UserRole } from '@ecommerce/shared';
import { ProductController } from '../controllers/ProductController';
import { ReviewController } from '../controllers/ReviewController';
import { ProductUseCase } from '../../../application/use-cases/ProductUseCase';
import { ReviewBrowseUseCase } from '../../../application/use-cases/ReviewBrowseUseCase';
import { ProductRepository } from '../../../infrastructure/repositories/ProductRepository';
import { CategoryRepository } from '../../../infrastructure/repositories/CategoryRepository';
import { SellerRepository } from '../../../infrastructure/repositories/SellerRepository';
import { ReviewRepository } from '../../../infrastructure/repositories/ReviewRepository';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createProductSchema, updateProductSchema } from '../schemas/productSchemas';

const productRepository = new ProductRepository();
const categoryRepository = new CategoryRepository();
const sellerRepository = new SellerRepository();
const reviewRepository = new ReviewRepository();
const userRepository = new UserRepository();

const productUseCase = new ProductUseCase(productRepository, categoryRepository, sellerRepository);
const reviewUseCase = new ReviewBrowseUseCase(reviewRepository, userRepository);

const productController = new ProductController(productUseCase);
const reviewController = new ReviewController(reviewUseCase);

const router: IRouter = Router();

// Seller — own product management (declared BEFORE :slug routes to avoid conflict)
router.get('/me/list', authenticate, authorize(UserRole.SELLER), productController.listMyProducts);
router.get('/me/:id', authenticate, authorize(UserRole.SELLER), productController.getMyProduct);
router.post(
  '/',
  authenticate,
  authorize(UserRole.SELLER),
  validate(createProductSchema),
  productController.create,
);
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.SELLER),
  validate(updateProductSchema),
  productController.update,
);
router.delete('/:id', authenticate, authorize(UserRole.SELLER), productController.delete);

// Reviews for a product
router.get('/:productId/reviews', reviewController.listForProduct);

// Public lookup
router.get('/', productController.search);
router.get('/by-id/:id', productController.getById);
router.get('/:slug', productController.getBySlug);

export default router;
