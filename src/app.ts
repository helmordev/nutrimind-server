import { sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';
import { auth } from '@/config/auth';
import { db } from '@/config/database';
import { env } from '@/config/env';
import { mongoClient } from '@/config/mongodb';
import { redis } from '@/config/redis';
import adminRoutes from '@/features/admin/admin.routes';
import studentAuthRoutes from '@/features/auth/auth.routes';
import hubRoutes from '@/features/hub/hub.routes';
import studentRoutes from '@/features/student/student.routes';
import teacherRoutes from '@/features/teacher/teacher.routes';
import { errorResponse, successResponse } from '@/shared/lib/response';
import { errorHandler } from '@/shared/middleware/error-handler';
import { requestLogger } from '@/shared/middleware/logger';

const app = new Hono();

// CORS must be registered before the Better Auth handler so preflight requests
// on /api/auth/** receive the correct Access-Control-* headers.
app.use(requestId());
app.use(requestLogger);
app.use(
  cors({
    origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true,
  }),
);
app.use(secureHeaders());

app.on(['POST', 'GET'], '/api/auth/**', (c) => auth.handler(c.req.raw));

app.route('/api/v1/students/auth', studentAuthRoutes);
app.route('/api/v1/students', studentRoutes);
app.route('/api/v1/hubs', hubRoutes);
app.route('/api/v1/teachers', teacherRoutes);
app.route('/api/v1/admin', adminRoutes);

app.get('/health', async (c) => {
  const checks: Record<string, { status: 'ok' | 'error'; latency?: number; error?: string }> = {};

  try {
    const pgStart = Date.now();
    await db.execute(sql`SELECT 1`);
    checks.postgres = { status: 'ok', latency: Date.now() - pgStart };
  } catch (err) {
    checks.postgres = { status: 'error', error: (err as Error).message };
  }

  try {
    const redisStart = Date.now();
    await redis.ping();
    checks.redis = { status: 'ok', latency: Date.now() - redisStart };
  } catch (err) {
    checks.redis = { status: 'error', error: (err as Error).message };
  }

  try {
    const mongoStart = Date.now();
    await mongoClient.db('admin').command({ ping: 1 });
    checks.mongodb = { status: 'ok', latency: Date.now() - mongoStart };
  } catch (err) {
    checks.mongodb = { status: 'error', error: (err as Error).message };
  }

  const allHealthy = Object.values(checks).every((s) => s.status === 'ok');
  const payload = { status: allHealthy ? 'ok' : 'degraded', timestamp: new Date().toISOString() };

  if (allHealthy) {
    return successResponse(c, { ...payload, services: checks });
  }

  return errorResponse(c, 'One or more services are unhealthy', 503, 'HEALTH_DEGRADED', {
    ...payload,
    services: checks,
  });
});

app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: { code: 'NOT_FOUND', message: `Route ${c.req.method} ${c.req.path} not found` },
    },
    404,
  );
});

app.onError(errorHandler);

export default app;
