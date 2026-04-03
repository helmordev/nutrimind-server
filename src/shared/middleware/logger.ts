import pino from "pino";
import type { Context, Next } from "hono";

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});

export async function requestLogger(c: Context, next: Next): Promise<void> {
  const start = Date.now();
  const { method, url } = c.req.raw;

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  logger.info(
    { method, url, status, duration },
    `${method} ${url} ${status} ${duration}ms`,
  );
}
