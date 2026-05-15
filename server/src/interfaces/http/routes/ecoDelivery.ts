import { Router, type IRouter } from 'express';
import { EcoDeliveryController } from '../controllers/EcoDeliveryController';
import { EcoDeliveryUseCase } from '../../../application/use-cases/EcoDeliveryUseCase';
import { OrderEcoMetricRepository } from '../../../infrastructure/repositories/OrderEcoMetricRepository';
import { OrderRepository } from '../../../infrastructure/repositories/OrderRepository';
import { authenticate } from '../middlewares/auth';

// Self-contained DI for the eco-delivery module — keeps the route file free of
// cross-feature concerns. Anything that needs eco metrics elsewhere should
// import the use-case class and wire its own instance.
const metricRepo = new OrderEcoMetricRepository();
const orderRepo = new OrderRepository();
const useCase = new EcoDeliveryUseCase(metricRepo, orderRepo);
const controller = new EcoDeliveryController(useCase);

const router: IRouter = Router();

// Public catalogue: the buyer needs to see the options before logging in.
router.get('/options', controller.listOptions);
router.get('/impact', controller.previewImpact);
router.get('/trees-planted', controller.treesPlanted);

// Locking in a choice (or reading it back) requires ownership of the order.
router.post('/orders/:orderId/choice', authenticate, controller.recordChoice);
router.get('/orders/:orderId/metric', authenticate, controller.getForOrder);

export default router;
