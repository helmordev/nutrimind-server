import { createHash } from 'node:crypto';
import { createMiddleware } from 'hono/factory';
import { env } from '@/config/env';
import { redis } from '@/config/redis';
import type { StudentTokenPayload } from '@/features/auth/auth.types';
import { AuthError } from '@/shared/lib/errors';

// Use ONLY for student routes — never mix with betterAuthMiddleware.
export const studentAuthMiddleware = createMiddleware(async (c, next) => {
  const authorization = c.req.header('Authorization');

  if (!authorization?.startsWith('Bearer ')) {
    throw new AuthError('Bearer token required', 'AUTH_REQUIRED');
  }

  const token = authorization.slice(7);

  try {
    const payload = await verifyStudentToken(token, env.JWT_SECRET);

    if (payload.type !== 'access') {
      throw new AuthError('Invalid token type', 'AUTH_INVALID_TOKEN');
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const isBlocklisted = await redis.get(`blocklist:access:${tokenHash}`);
    if (isBlocklisted) {
      throw new AuthError('Token has been revoked', 'AUTH_TOKEN_REVOKED');
    }

    c.set('student', payload);
  } catch (err) {
    if (err instanceof AuthError) throw err;
    throw new AuthError('Invalid or expired token', 'AUTH_INVALID_TOKEN');
  }

  await next();
});

// Inline verification to avoid circular imports — full implementation in auth.service.ts
async function verifyStudentToken(token: string, secret: string): Promise<StudentTokenPayload> {
  const { verify } = await import('hono/jwt');
  const payload = await verify(token, secret, 'HS256');
  return payload as unknown as StudentTokenPayload;
}
