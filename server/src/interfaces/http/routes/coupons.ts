import { Router, type IRouter } from 'express';
import { CouponController } from '../controllers/CouponController';
import { CouponUseCase } from '../../../application/use-cases/CouponUseCase';
import { CouponRepository } from '../../../infrastructure/repositories/CouponRepository';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { validateCouponSchema } from '../schemas/orderSchemas';

const couponUseCase = new CouponUseCase(new CouponRepository());
const couponController = new CouponController(couponUseCase);

const router: IRouter = Router();

router.post('/validate', authenticate, validate(validateCouponSchema), couponController.validate);

export default router;
