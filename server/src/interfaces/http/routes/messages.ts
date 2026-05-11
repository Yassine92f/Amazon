import { Router, type IRouter } from 'express';
import { MessageController } from '../controllers/MessageController';
import { MessagingUseCase } from '../../../application/use-cases/MessagingUseCase';
import { NotificationUseCase } from '../../../application/use-cases/NotificationUseCase';
import { ConversationRepository } from '../../../infrastructure/repositories/ConversationRepository';
import { MessageRepository } from '../../../infrastructure/repositories/MessageRepository';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { NotificationRepository } from '../../../infrastructure/repositories/NotificationRepository';
import { socketGateway } from '../../../infrastructure/realtime/SocketGateway';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { startConversationSchema, sendMessageSchema } from '../schemas/messageSchemas';

const notificationUseCase = new NotificationUseCase(new NotificationRepository(), socketGateway);
const messagingUseCase = new MessagingUseCase(
  new ConversationRepository(),
  new MessageRepository(),
  new UserRepository(),
  notificationUseCase,
  socketGateway,
);
const controller = new MessageController(messagingUseCase);

const router: IRouter = Router();
router.use(authenticate);

router.get('/unread-count', controller.unreadCount);
router.get('/conversations', controller.listConversations);
router.post('/conversations', validate(startConversationSchema), controller.startConversation);
router.get('/conversations/:id', controller.getMessages);
router.post('/conversations/:id', validate(sendMessageSchema), controller.sendMessage);

export default router;
