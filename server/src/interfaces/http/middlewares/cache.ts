import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../../../infrastructure/cache/redis';
import { logger } from '../../../infrastructure/logging/logger';
import { config } from '../../../config';

const CACHE_PREFIX = 'cache:';

/**
 * Caches successful JSON responses of idempotent GET endpoints in Redis, keyed
 * by the full request URL (so query strings produce distinct entries).
 *
 * Resilient by design: any Redis failure (or running with no Redis at all)
 * silently bypasses the cache instead of failing the request. Disabled in the
 * test environment to keep the suite hermetic.
 */
export function cacheResponse(namespace: string, ttlSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (config.env === 'test') return next();

    const key = `${CACHE_PREFIX}${namespace}:${req.originalUrl}`;
    let redis;
    try {
      redis = getRedisClient();
      const cached = await redis.get(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.type('application/json').send(cached);
        return;
      }
    } catch (err) {
      logger.warn({ err }, 'Cache read failed, bypassing cache');
      return next();
    }

    res.setHeader('X-Cache', 'MISS');
    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        redis
          .set(key, JSON.stringify(body), 'EX', ttlSeconds)
          .catch((err) => logger.warn({ err }, 'Cache write failed'));
      }
      return originalJson(body);
    }) as Response['json'];

    next();
  };
}

/**
 * Drops every cached entry under a namespace. Called from write paths
 * (create/update/delete) so reads never serve stale catalog data.
 */
export async function invalidateNamespace(namespace: string): Promise<void> {
  if (config.env === 'test') return;
  try {
    const redis = getRedisClient();
    const pattern = `${CACHE_PREFIX}${namespace}:*`;
    const stream = redis.scanStream({ match: pattern, count: 100 });
    const keys: string[] = [];
    for await (const batch of stream as AsyncIterable<string[]>) keys.push(...batch);
    if (keys.length > 0) await redis.del(...keys);
  } catch (err) {
    logger.warn({ err }, 'Cache invalidation failed');
  }
}
