import { Router, type IRouter } from 'express';
import { UserRole } from '@ecommerce/shared';
import { CategoryController } from '../controllers/CategoryController';
import { CategoryUseCase } from '../../../application/use-cases/CategoryUseCase';
import { CategoryRepository } from '../../../infrastructure/repositories/CategoryRepository';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { cacheResponse } from '../middlewares/cache';
import { createCategorySchema, updateCategorySchema } from '../schemas/categorySchemas';

const categoryRepository = new CategoryRepository();
const categoryUseCase = new CategoryUseCase(categoryRepository);
const categoryController = new CategoryController(categoryUseCase);

const router: IRouter = Router();

// Categories are near-static; cache them for longer than products.
const CATEGORY_CACHE_TTL = 300; // seconds

// Public (cached in Redis)
router.get('/', cacheResponse('categories', CATEGORY_CACHE_TTL), categoryController.list);
router.get('/tree', cacheResponse('categories', CATEGORY_CACHE_TTL), categoryController.tree);
router.get('/:slug', cacheResponse('categories', CATEGORY_CACHE_TTL), categoryController.getBySlug);

// Admin
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(createCategorySchema),
  categoryController.create,
);
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(updateCategorySchema),
  categoryController.update,
);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), categoryController.delete);

export default router;
