import { Router, type IRouter } from 'express';
import { UserRole } from '@ecommerce/shared';
import { DisputeController } from '../controllers/DisputeController';
import { DisputeUseCase } from '../../../application/use-cases/DisputeUseCase';
import { DisputeRepository } from '../../../infrastructure/repositories/DisputeRepository';
import { OrderRepository } from '../../../infrastructure/repositories/OrderRepository';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createDisputeSchema, resolveDisputeSchema } from '../schemas/disputeSchemas';

const disputeUseCase = new DisputeUseCase(
  new DisputeRepository(),
  new OrderRepository(),
  new UserRepository(),
);
const disputeController = new DisputeController(disputeUseCase);

const router: IRouter = Router();

router.use(authenticate);

// Buyer
router.post('/', validate(createDisputeSchema), disputeController.open);
router.get('/mine', disputeController.mine);

// Admin
router.get('/', authorize(UserRole.ADMIN), disputeController.list);
router.patch(
  '/:id',
  authorize(UserRole.ADMIN),
  validate(resolveDisputeSchema),
  disputeController.resolve,
);

export default router;
