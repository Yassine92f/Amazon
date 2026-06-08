import { Router, type IRouter } from 'express';
import { UserRole } from '@ecommerce/shared';
import { ProductController } from '../controllers/ProductController';
import { ReviewController } from '../controllers/ReviewController';
import { SellerReviewController } from '../controllers/SellerReviewController';
import { PriceHistoryController } from '../controllers/PriceHistoryController';
import { ProductUseCase } from '../../../application/use-cases/ProductUseCase';
import { ReviewBrowseUseCase } from '../../../application/use-cases/ReviewBrowseUseCase';
import { SellerReviewUseCase } from '../../../application/use-cases/SellerReviewUseCase';
import { PriceHistoryUseCase } from '../../../application/use-cases/PriceHistoryUseCase';
import { ProductRepository } from '../../../infrastructure/repositories/ProductRepository';
import { CategoryRepository } from '../../../infrastructure/repositories/CategoryRepository';
import { SellerRepository } from '../../../infrastructure/repositories/SellerRepository';
import { ReviewRepository } from '../../../infrastructure/repositories/ReviewRepository';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { PriceHistoryRepository } from '../../../infrastructure/repositories/PriceHistoryRepository';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { cacheResponse } from '../middlewares/cache';
import {
  createProductSchema,
  updateProductSchema,
  replyToReviewSchema,
} from '../schemas/productSchemas';

// Catalog reads are high-traffic and change rarely; cache them briefly in Redis.
const PRODUCT_CACHE_TTL = 60; // seconds

const productRepository = new ProductRepository();
const categoryRepository = new CategoryRepository();
const sellerRepository = new SellerRepository();
const reviewRepository = new ReviewRepository();
const userRepository = new UserRepository();
const priceHistoryRepository = new PriceHistoryRepository();

const productUseCase = new ProductUseCase(
  productRepository,
  categoryRepository,
  sellerRepository,
  priceHistoryRepository,
);
const reviewUseCase = new ReviewBrowseUseCase(reviewRepository, userRepository);
const sellerReviewUseCase = new SellerReviewUseCase(
  reviewRepository,
  productRepository,
  sellerRepository,
  userRepository,
);
const priceHistoryUseCase = new PriceHistoryUseCase(priceHistoryRepository, productRepository);

const productController = new ProductController(productUseCase);
const reviewController = new ReviewController(reviewUseCase);
const sellerReviewController = new SellerReviewController(sellerReviewUseCase);
const priceHistoryController = new PriceHistoryController(priceHistoryUseCase);

const router: IRouter = Router();

// Seller — reviews on own products (declared BEFORE :slug routes to avoid conflict)
router.get('/me/reviews', authenticate, authorize(UserRole.SELLER), sellerReviewController.list);
router.post(
  '/reviews/:reviewId/reply',
  authenticate,
  authorize(UserRole.SELLER),
  validate(replyToReviewSchema),
  sellerReviewController.respond,
);

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

// Price history (transparency chart on product detail page) — public, cacheable.
router.get(
  '/:id/price-history',
  cacheResponse('products', PRODUCT_CACHE_TTL),
  priceHistoryController.get,
);

// Public lookup (cached in Redis, invalidated on product writes)
router.get('/', cacheResponse('products', PRODUCT_CACHE_TTL), productController.search);
router.get('/by-id/:id', cacheResponse('products', PRODUCT_CACHE_TTL), productController.getById);
router.get('/:slug', cacheResponse('products', PRODUCT_CACHE_TTL), productController.getBySlug);

export default router;
