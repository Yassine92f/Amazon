import { Router, type IRouter } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthUseCase } from '../../../application/use-cases/AuthUseCase';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { HashService } from '../../../infrastructure/services/HashService';
import { TokenService } from '../../../infrastructure/services/TokenService';
import { EmailService } from '../../../infrastructure/services/EmailService';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  authStrictLimiter,
  authLooseLimiter,
  passwordResetLimiter,
} from '../middlewares/rateLimit';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from '../schemas/authSchemas';
import { config } from '../../../config';

const userRepository = new UserRepository();
const hashService = new HashService();
const tokenService = new TokenService();
const emailService = new EmailService();
const authUseCase = new AuthUseCase(userRepository, hashService, tokenService, emailService, {
  clientUrl: config.clientUrl,
});
const authController = new AuthController(authUseCase);

const router: IRouter = Router();

router.post('/register', authStrictLimiter, validate(registerSchema), authController.register);
router.post('/login', authStrictLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authLooseLimiter, validate(refreshSchema), authController.refresh);
router.post('/logout', validate(logoutSchema), authController.logout);
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);
router.post(
  '/reset-password',
  passwordResetLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword,
);
router.post(
  '/verify-email',
  authLooseLimiter,
  validate(verifyEmailSchema),
  authController.verifyEmail,
);
router.post(
  '/resend-verification',
  passwordResetLimiter,
  validate(resendVerificationSchema),
  authController.resendVerification,
);

router.get('/me', authenticate, authController.getMe);
router.put(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword,
);

export default router;
