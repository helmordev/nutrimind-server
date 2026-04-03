import { createMiddleware } from 'hono/factory';
import { ForbiddenError } from '@/shared/lib/errors';

type AllowedRole = 'admin' | 'teacher';

// Role guard — must be applied AFTER betterAuthMiddleware.
// Checks the `role` field on the Better Auth user object.
export const requireRole = (role: AllowedRole) =>
  createMiddleware(async (c, next) => {
    const user = c.get('user') as { role?: string | null } | undefined;

    if (!user) {
      throw new ForbiddenError('No authenticated user in context', 'AUTH_REQUIRED');
    }

    const userRole = user.role ?? 'teacher';

    if (role === 'admin' && userRole !== 'admin') {
      throw new ForbiddenError('Admin access required', 'FORBIDDEN_ADMIN_ONLY');
    }

    if (role === 'teacher' && userRole !== 'teacher') {
      throw new ForbiddenError('Teacher access required', 'FORBIDDEN_TEACHER_ONLY');
    }

    await next();
  });
