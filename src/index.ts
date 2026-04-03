import app from '@/app';
import { env } from '@/config/env';
import { mongoClient } from '@/config/mongodb';
import { redis } from '@/config/redis';
import { logger } from '@/shared/middleware/logger';

async function bootstrap(): Promise<void> {
  // Connect MongoDB — non-fatal: server still starts, health check reports status
  try {
    await mongoClient.connect();
    logger.info('MongoDB connected');
  } catch (err) {
    logger.warn({ err }, 'MongoDB connection failed — server will start in degraded mode');
  }

  // Connect Redis — non-fatal: server still starts, health check reports status
  try {
    await redis.connect();
    logger.info('Redis connected');
  } catch (err) {
    logger.warn({ err }, 'Redis connection failed — server will start in degraded mode');
  }

  Bun.serve({
    port: env.PORT,
    fetch(req, server) {
      const { pathname } = new URL(req.url);

      // TEST: intercept WS upgrade before Hono — remove when Phase 7 WS is wired up
      if (pathname === '/ws/test') {
        const upgraded = server.upgrade(req);
        if (upgraded) return undefined;
        return new Response('WebSocket upgrade failed', { status: 400 });
      }

      return app.fetch(req);
    },
    websocket: {
      open(ws) {
        logger.info('Test WS connection opened');
        ws.send(JSON.stringify({ type: 'connected', message: 'NutriMind WS test ready' }));
      },
      message(ws, data) {
        logger.info({ data }, 'Test WS message received');
        ws.send(JSON.stringify({ type: 'echo', data: String(data) }));
      },
      close(_ws, code, reason) {
        logger.info({ code, reason }, 'Test WS connection closed');
      },
    },
  });

  logger.info(`🚀 NutriMind server running on port ${env.PORT}`);
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
