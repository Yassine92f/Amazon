import { Router, type IRouter } from 'express';
import { UserRole } from '@ecommerce/shared';
import { PaymentController } from '../controllers/PaymentController';
import { PaymentUseCase } from '../../../application/use-cases/PaymentUseCase';
import { StripePaymentService } from '../../../infrastructure/services/StripePaymentService';
import { PaymentRepository } from '../../../infrastructure/repositories/PaymentRepository';
import { OrderRepository } from '../../../infrastructure/repositories/OrderRepository';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { EmailService } from '../../../infrastructure/services/EmailService';
import { config } from '../../../config';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createPaymentIntentSchema, refundSchema } from '../schemas/paymentSchemas';

const paymentService = new StripePaymentService();
const paymentRepository = new PaymentRepository();
const orderRepository = new OrderRepository();
const userRepository = new UserRepository();
const emailService = new EmailService();
const paymentUseCase = new PaymentUseCase(
  paymentService,
  paymentRepository,
  orderRepository,
  userRepository,
  emailService,
  { clientUrl: config.clientUrl },
);
const paymentController = new PaymentController(paymentUseCase);

const router: IRouter = Router();

// Stripe webhook — public (verified by signature). The raw body parser is
// registered for this path in app.ts, before the global JSON parser.
router.post('/webhook', paymentController.webhook);

router.post(
  '/intent',
  authenticate,
  validate(createPaymentIntentSchema),
  paymentController.createIntent,
);
router.post(
  '/confirm',
  authenticate,
  validate(createPaymentIntentSchema),
  paymentController.confirm,
);
router.post(
  '/refund',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(refundSchema),
  paymentController.refund,
);

export default router;
