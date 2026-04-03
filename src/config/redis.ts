import { Redis } from 'ioredis';
import { env } from '@/config/env';
import { logger } from '@/shared/middleware/logger';

export const redis = new Redis(env.UPSTASH_REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
  tls: env.UPSTASH_REDIS_URL.startsWith('rediss://') ? {} : undefined,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error({ err }, 'Redis connection error'));
