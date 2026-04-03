import { sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';
import { db } from '@/config/database';
import { env } from '@/config/env';
import { mongoClient } from '@/config/mongodb';
import { redis } from '@/config/redis';
import { errorHandler } from '@/shared/middleware/error-handler';
import { requestLogger } from '@/shared/middleware/logger';

const app = new Hono();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(requestId());
app.use(requestLogger);
app.use(
  cors({
    origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true,
  }),
);
app.use(secureHeaders());

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', async (c) => {
  const checks: Record<string, { status: 'ok' | 'error'; latency?: number; error?: string }> = {};

  // PostgreSQL
  try {
    const pgStart = Date.now();
    await db.execute(sql`SELECT 1`);
    checks.postgres = { status: 'ok', latency: Date.now() - pgStart };
  } catch (err) {
    checks.postgres = { status: 'error', error: (err as Error).message };
  }

  // Redis
  try {
    const redisStart = Date.now();
    await redis.ping();
    checks.redis = { status: 'ok', latency: Date.now() - redisStart };
  } catch (err) {
    checks.redis = { status: 'error', error: (err as Error).message };
  }

  // MongoDB
  try {
    const mongoStart = Date.now();
    await mongoClient.db('admin').command({ ping: 1 });
    checks.mongodb = { status: 'ok', latency: Date.now() - mongoStart };
  } catch (err) {
    checks.mongodb = { status: 'error', error: (err as Error).message };
  }

  const allHealthy = Object.values(checks).every((c) => c.status === 'ok');

  return c.json(
    {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: checks,
    },
    allHealthy ? 200 : 503,
  );
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: { code: 'NOT_FOUND', message: `Route ${c.req.method} ${c.req.path} not found` },
    },
    404,
  );
});

// ── Error Handler ─────────────────────────────────────────────────────────────
app.onError(errorHandler);

export default app;
