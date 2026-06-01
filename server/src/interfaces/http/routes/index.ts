import { Router, type IRouter } from 'express';
import healthRouter from './health';
import authRouter from './auth';
import adminRouter from './admin';
import usersRouter from './users';
import sellersRouter from './sellers';
import categoriesRouter from './categories';
import productsRouter from './products';

const router: IRouter = Router();

router.use(healthRouter);

// Section 1 — Auth & Admin
router.use('/auth', authRouter);
router.use('/admin', adminRouter);
router.use('/users', usersRouter);

// Section 2 — Catalog & Search
router.use('/sellers', sellersRouter);
router.use('/categories', categoriesRouter);
router.use('/products', productsRouter);

// router.use('/cart', cartRouter);       — Section 3
// router.use('/orders', ordersRouter);   — Section 3
// router.use('/notifications', notificationsRouter); — Section 4
// router.use('/messages', messagesRouter); — Section 4

export default router;
