import mongoose from 'mongoose';
import { config } from '../../config';
import { logger } from '../logging/logger';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.uri);
    logger.info('MongoDB connected');
  } catch (error) {
    logger.error({ err: error }, 'MongoDB connection error');
    process.exit(1);
  }
}

export async function closeDatabase(): Promise<void> {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
}
