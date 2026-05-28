import { Router, type IRouter } from 'express';
import { UserRole } from '@ecommerce/shared';
import { CategoryController } from '../controllers/CategoryController';
import { CategoryUseCase } from '../../../application/use-cases/CategoryUseCase';
import { CategoryRepository } from '../../../infrastructure/repositories/CategoryRepository';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createCategorySchema, updateCategorySchema } from '../schemas/categorySchemas';

const categoryRepository = new CategoryRepository();
const categoryUseCase = new CategoryUseCase(categoryRepository);
const categoryController = new CategoryController(categoryUseCase);

const router: IRouter = Router();

// Public
router.get('/', categoryController.list);
router.get('/tree', categoryController.tree);
router.get('/:slug', categoryController.getBySlug);

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
