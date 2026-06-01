import { Router, type IRouter } from 'express';
import { UserController } from '../controllers/UserController';
import { ProfileUseCase } from '../../../application/use-cases/ProfileUseCase';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { HashService } from '../../../infrastructure/services/HashService';
import { authenticate } from '../middlewares/auth';

// Dependency injection
const userRepository = new UserRepository();
const hashService = new HashService();
const profileUseCase = new ProfileUseCase(userRepository, hashService);
const userController = new UserController(profileUseCase);

const router: IRouter = Router();

// All routes require authentication
router.use(authenticate);

// Profile
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// Addresses
router.get('/addresses', userController.getAddresses);
router.post('/addresses', userController.addAddress);
router.put('/addresses/:id', userController.updateAddress);
router.delete('/addresses/:id', userController.deleteAddress);

// Preferences
router.get('/preferences', userController.getPreferences);
router.put('/preferences', userController.updatePreferences);

export default router;
