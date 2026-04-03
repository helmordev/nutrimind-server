import { Redis } from 'ioredis';
import { env } from '@/config/env';

export const redis = new Redis(env.UPSTASH_REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
  tls: env.UPSTASH_REDIS_URL.startsWith('rediss://') ? {} : undefined,
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});
