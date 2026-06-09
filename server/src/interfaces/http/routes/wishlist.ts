import { Router, type IRouter } from 'express';
import { WishlistController } from '../controllers/WishlistController';
import { WishlistUseCase } from '../../../application/use-cases/WishlistUseCase';
import { WishlistRepository } from '../../../infrastructure/repositories/WishlistRepository';
import { ProductRepository } from '../../../infrastructure/repositories/ProductRepository';
import { authenticate } from '../middlewares/auth';

const wishlistUseCase = new WishlistUseCase(new WishlistRepository(), new ProductRepository());
const wishlistController = new WishlistController(wishlistUseCase);

const router: IRouter = Router();

router.use(authenticate);

router.get('/', wishlistController.get);
router.post('/:productId', wishlistController.add);
router.delete('/:productId', wishlistController.remove);
router.post('/:productId/toggle', wishlistController.toggle);

export default router;
