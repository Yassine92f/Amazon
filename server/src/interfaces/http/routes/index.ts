import { Router, type IRouter } from 'express';
import healthRouter from './health';
import authRouter from './auth';
import adminRouter from './admin';
import usersRouter from './users';

const router: IRouter = Router();

router.use(healthRouter);

// Section 1 — Auth & Admin
router.use('/auth', authRouter);
router.use('/admin', adminRouter);
router.use('/users', usersRouter);
// router.use('/products', productsRouter); — Section 2
// router.use('/categories', categoriesRouter); — Section 2
// router.use('/cart', cartRouter);       — Section 3
// router.use('/orders', ordersRouter);   — Section 3
// router.use('/reviews', reviewsRouter); — Section 3
// router.use('/notifications', notificationsRouter); — Section 4
// router.use('/messages', messagesRouter); — Section 4

export default router;
