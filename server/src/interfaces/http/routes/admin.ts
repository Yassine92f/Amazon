import { Router, type IRouter } from 'express';
import { UserRole } from '@ecommerce/shared';
import { AdminController } from '../controllers/AdminController';
import { AdminUseCase } from '../../../application/use-cases/AdminUseCase';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { authenticate, authorize } from '../middlewares/auth';

// Dependency injection
const userRepository = new UserRepository();
const adminUseCase = new AdminUseCase(userRepository);
const adminController = new AdminController(adminUseCase);

const router: IRouter = Router();

// All routes require admin role
router.use(authenticate, authorize(UserRole.ADMIN));

router.get('/', adminController.getDashboardStats);
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);

export default router;
