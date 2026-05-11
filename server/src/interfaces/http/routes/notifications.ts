import { Router, type IRouter } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { NotificationUseCase } from '../../../application/use-cases/NotificationUseCase';
import { NotificationRepository } from '../../../infrastructure/repositories/NotificationRepository';
import { socketGateway } from '../../../infrastructure/realtime/SocketGateway';
import { authenticate } from '../middlewares/auth';

const useCase = new NotificationUseCase(new NotificationRepository(), socketGateway);
const controller = new NotificationController(useCase);

const router: IRouter = Router();
router.use(authenticate);

router.get('/', controller.list);
router.get('/unread-count', controller.unreadCount);
router.patch('/read-all', controller.markAllRead);
router.patch('/:id/read', controller.markRead);

export default router;
