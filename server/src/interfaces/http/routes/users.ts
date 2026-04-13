import { Router, type IRouter } from 'express';
import { UserController } from '../controllers/UserController';
import { ProfileUseCase } from '../../../application/use-cases/ProfileUseCase';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { authenticate } from '../middlewares/auth';

// Dependency injection
const userRepository = new UserRepository();
const profileUseCase = new ProfileUseCase(userRepository);
const userController = new UserController(profileUseCase);

const router: IRouter = Router();

// All routes require authentication
router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

export default router;
