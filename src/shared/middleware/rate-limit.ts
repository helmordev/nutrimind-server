import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { redis } from '@/config/redis';
import { AppError } from '@/shared/lib/errors';

export interface RateLimitOptions {
  // Max requests allowed in the window
  max: number;
  // Window duration in seconds
  windowSec: number;
  // Key prefix for Redis — e.g. "student_login" → "rate_limit:student_login:{id}:{window}"
  keyPrefix: string;
  // Returns the identifier to rate-limit on (e.g. IP, studentId)
  identifier: (c: Context) => string | Promise<string>;
}

// Redis INCR/EXPIRE sliding-window rate limiter.
// Key format: rate_limit:{keyPrefix}:{identifier}:{windowStart}
export const rateLimit = (opts: RateLimitOptions) =>
  createMiddleware(async (c, next) => {
    const id = await opts.identifier(c);
    const windowStart = Math.floor(Date.now() / 1000 / opts.windowSec);
    const key = `rate_limit:${opts.keyPrefix}:${id}:${windowStart}`;

    const count = await redis.incr(key);

    if (count === 1) {
      // Set TTL only on first increment to avoid resetting the window
      await redis.expire(key, opts.windowSec * 2);
    }

    if (count > opts.max) {
      const retryAfter = opts.windowSec - (Math.floor(Date.now() / 1000) % opts.windowSec);
      throw new AppError(
        `Too many requests. Retry after ${retryAfter} seconds.`,
        429,
        'RATE_LIMIT_EXCEEDED',
      );
    }

    await next();
  });
