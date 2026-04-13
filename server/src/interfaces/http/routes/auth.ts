import { Router, type IRouter } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthUseCase } from '../../../application/use-cases/AuthUseCase';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { HashService } from '../../../infrastructure/services/HashService';
import { TokenService } from '../../../infrastructure/services/TokenService';
import { authenticate } from '../middlewares/auth';

// Dependency injection
const userRepository = new UserRepository();
const hashService = new HashService();
const tokenService = new TokenService();
const authUseCase = new AuthUseCase(userRepository, hashService, tokenService);
const authController = new AuthController(authUseCase);

const router: IRouter = Router();

// Public
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected
router.get('/me', authenticate, authController.getMe);
router.put('/change-password', authenticate, authController.changePassword);

export default router;
