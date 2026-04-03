import { createMiddleware } from 'hono/factory';
import { auth } from '@/config/auth';
import { AuthError } from '@/shared/lib/errors';

export const betterAuthMiddleware = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    throw new AuthError('Authentication required', 'AUTH_REQUIRED');
  }

  c.set('user', session.user);
  c.set('session', session.session);

  await next();
});
