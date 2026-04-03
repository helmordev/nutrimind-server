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

  // Connect Redis — non-fatal
  try {
    await redis.connect();
    logger.info('Redis connected');
  } catch (err) {
    logger.warn({ err }, 'Redis connection failed — server will start in degraded mode');
  }

  // Start server — always runs regardless of service health
  Bun.serve({
    port: env.PORT,
    fetch: app.fetch,
  });

  logger.info(`🚀 NutriMind server running on port ${env.PORT}`);
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
