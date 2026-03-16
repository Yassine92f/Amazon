import Redis from 'ioredis';
import { config } from '../../config';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (times > 3) {
          console.warn('⚠ Redis connection failed, continuing without cache');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
    });

    redisClient.on('connect', () => console.log('✓ Redis connected'));
    redisClient.on('error', (err: Error) => console.error('✗ Redis error:', err.message));
  }
  return redisClient;
}
