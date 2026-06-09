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
import ecoDeliveryRouter from './ecoDelivery';
import recommendationsRouter from './recommendations';
import notificationsRouter from './notifications';
import messagesRouter from './messages';
import uploadsRouter from './uploads';
import disputesRouter from './disputes';

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
router.use('/disputes', disputesRouter);
router.use('/payments', paymentsRouter);
router.use('/reviews', reviewsRouter);

// Transversal — eco-delivery (CO2 transparency at checkout).
router.use('/eco-delivery', ecoDeliveryRouter);

// Image uploads (multipart -> local disk, served from /uploads)
router.use('/uploads', uploadsRouter);

// Bonus — Recommendation engine
router.use('/recommendations', recommendationsRouter);

// Section 4 — Realtime: notifications & messaging
router.use('/notifications', notificationsRouter);
router.use('/messages', messagesRouter);

export default router;
