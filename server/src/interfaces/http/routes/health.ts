import { Router, type IRouter } from 'express';
import mongoose from 'mongoose';

const router: IRouter = Router();

router.get('/health', (_req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: mongoStatus,
      },
    },
  });
});

export default router;
