import { Router, type IRouter } from 'express';
import { UserRole } from '@ecommerce/shared';
import { AdminController } from '../controllers/AdminController';
import { AdminUseCase } from '../../../application/use-cases/AdminUseCase';
import { CouponAdminController } from '../controllers/CouponAdminController';
import { CouponAdminUseCase } from '../../../application/use-cases/CouponAdminUseCase';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { AuditLogRepository } from '../../../infrastructure/repositories/AuditLogRepository';
import { ProductRepository } from '../../../infrastructure/repositories/ProductRepository';
import { SellerRepository } from '../../../infrastructure/repositories/SellerRepository';
import { CouponRepository } from '../../../infrastructure/repositories/CouponRepository';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createCouponSchema, updateCouponSchema } from '../schemas/couponSchemas';

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
const couponAdminController = new CouponAdminController(
  new CouponAdminUseCase(new CouponRepository()),
);

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

// Coupon management
router.get('/coupons', couponAdminController.list);
router.post('/coupons', validate(createCouponSchema), couponAdminController.create);
router.put('/coupons/:id', validate(updateCouponSchema), couponAdminController.update);
router.delete('/coupons/:id', couponAdminController.remove);

router.get('/audit-log', adminController.getAuditLogs);

export default router;
