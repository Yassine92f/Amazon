import { Router, type IRouter } from 'express';
import healthRouter from './health';
import authRouter from './auth';
import adminRouter from './admin';
import usersRouter from './users';
import sellersRouter from './sellers';
import categoriesRouter from './categories';
import productsRouter from './products';
import cartRouter from './cart';
import ordersRouter from './orders';
import couponsRouter from './coupons';
import wishlistRouter from './wishlist';
import paymentsRouter from './payments';
import reviewsRouter from './reviews';
import recommendationsRouter from './recommendations';

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

// Section 3 — Cart, Orders & Payment
router.use('/cart', cartRouter);
router.use('/orders', ordersRouter);
router.use('/coupons', couponsRouter);
router.use('/wishlist', wishlistRouter);
router.use('/payments', paymentsRouter);
router.use('/reviews', reviewsRouter);

// Bonus — Recommendation engine
router.use('/recommendations', recommendationsRouter);

// router.use('/notifications', notificationsRouter); — Section 4
// router.use('/messages', messagesRouter); — Section 4

export default router;
