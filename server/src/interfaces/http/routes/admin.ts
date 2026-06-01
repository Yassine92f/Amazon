import { Router, type IRouter } from 'express';
import { UserRole } from '@ecommerce/shared';
import { AdminController } from '../controllers/AdminController';
import { AdminUseCase } from '../../../application/use-cases/AdminUseCase';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { AuditLogRepository } from '../../../infrastructure/repositories/AuditLogRepository';
import { ProductRepository } from '../../../infrastructure/repositories/ProductRepository';
import { SellerRepository } from '../../../infrastructure/repositories/SellerRepository';
import { authenticate, authorize } from '../middlewares/auth';

const userRepository = new UserRepository();
const auditLogRepository = new AuditLogRepository();
const productRepository = new ProductRepository();
const sellerRepository = new SellerRepository();
const adminUseCase = new AdminUseCase(
  userRepository,
  auditLogRepository,
  productRepository,
  sellerRepository,
);
const adminController = new AdminController(adminUseCase);

const router: IRouter = Router();

router.use(authenticate, authorize(UserRole.ADMIN));

router.get('/', adminController.getDashboardStats);
router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/status', adminController.updateUserStatus);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// Product moderation (supervise seller products)
router.get('/products', adminController.listProducts);
router.put('/products/:id/status', adminController.setProductActive);
router.delete('/products/:id', adminController.deleteProduct);

router.get('/audit-log', adminController.getAuditLogs);

export default router;
