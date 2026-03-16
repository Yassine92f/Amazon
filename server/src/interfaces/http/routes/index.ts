import { Router, type IRouter } from 'express';
import healthRouter from './health';

const router: IRouter = Router();

router.use(healthRouter);

// Future route modules will be added here:
// router.use('/auth', authRouter);       — Section 1
// router.use('/users', usersRouter);     — Section 1
// router.use('/products', productsRouter); — Section 2
// router.use('/categories', categoriesRouter); — Section 2
// router.use('/cart', cartRouter);       — Section 3
// router.use('/orders', ordersRouter);   — Section 3
// router.use('/reviews', reviewsRouter); — Section 3
// router.use('/notifications', notificationsRouter); — Section 4
// router.use('/messages', messagesRouter); — Section 4

export default router;
