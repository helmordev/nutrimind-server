import { createMiddleware } from 'hono/factory';
import { env } from '@/config/env';
import type { StudentTokenPayload } from '@/features/auth/auth.types';
import { AuthError } from '@/shared/lib/errors';

// Verifies the student JWT Bearer token.
// Attaches `student` to Hono context variables.
// Use ONLY for student routes — never mix with betterAuthMiddleware.
export const studentAuthMiddleware = createMiddleware(async (c, next) => {
  const authorization = c.req.header('Authorization');

  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new AuthError('Bearer token required', 'AUTH_REQUIRED');
  }

  const token = authorization.slice(7);

  try {
    const payload = await verifyStudentToken(token, env.JWT_SECRET);
    c.set('student', payload);
  } catch {
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
