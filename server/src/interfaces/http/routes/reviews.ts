import { Router, type IRouter } from 'express';
import { BuyerReviewController } from '../controllers/BuyerReviewController';
import { ReviewUseCase } from '../../../application/use-cases/ReviewUseCase';
import { ReviewRepository } from '../../../infrastructure/repositories/ReviewRepository';
import { OrderRepository } from '../../../infrastructure/repositories/OrderRepository';
import { ProductRepository } from '../../../infrastructure/repositories/ProductRepository';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createReviewSchema } from '../schemas/reviewSchemas';

const useCase = new ReviewUseCase(
  new ReviewRepository(),
  new OrderRepository(),
  new ProductRepository(),
);
const controller = new BuyerReviewController(useCase);

const router: IRouter = Router();
router.use(authenticate);

router.get('/mine', controller.mine);
router.post('/', validate(createReviewSchema), controller.create);

export default router;
