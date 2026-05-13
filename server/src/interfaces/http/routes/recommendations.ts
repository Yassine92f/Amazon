import { Router, type IRouter } from 'express';
import { RecommendationController } from '../controllers/RecommendationController';
import { RecommendationUseCase } from '../../../application/use-cases/RecommendationUseCase';
import { ProductRepository } from '../../../infrastructure/repositories/ProductRepository';
import { OrderRepository } from '../../../infrastructure/repositories/OrderRepository';
import { ProductViewRepository } from '../../../infrastructure/repositories/ProductViewRepository';
import { SellerRepository } from '../../../infrastructure/repositories/SellerRepository';
import { CategoryRepository } from '../../../infrastructure/repositories/CategoryRepository';
import { authenticate, optionalAuthenticate } from '../middlewares/auth';

const recommendationUseCase = new RecommendationUseCase(
  new ProductRepository(),
  new OrderRepository(),
  new ProductViewRepository(),
  new SellerRepository(),
  new CategoryRepository(),
);
const controller = new RecommendationController(recommendationUseCase);

const router: IRouter = Router();

// Personalized feed for the logged-in user.
router.get('/', authenticate, controller.forMe);

// "You may also like" for a product page (works for guests).
router.get('/similar/:productId', controller.similar);

// Behavioral signal: record a product view (recorded only when authenticated).
router.post('/views/:productId', optionalAuthenticate, controller.recordView);

export default router;
