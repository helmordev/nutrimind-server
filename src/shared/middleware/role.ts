import { createMiddleware } from 'hono/factory';
import { ForbiddenError } from '@/shared/lib/errors';

type AllowedRole = 'admin' | 'teacher';

// Must be applied AFTER betterAuthMiddleware.
// Admins are implicitly allowed wherever teachers are allowed (admin ⊇ teacher).
export const requireRole = (role: AllowedRole) =>
  createMiddleware(async (c, next) => {
    const user = c.get('user') as { role?: string | null } | undefined;

    if (!user) {
      throw new ForbiddenError('No authenticated user in context', 'AUTH_REQUIRED');
    }

    // Never silently default an unknown role — missing role is a configuration error
    const userRole = user.role;
    if (!userRole) {
      throw new ForbiddenError('User has no assigned role', 'AUTH_ROLE_MISSING');
    }

    if (role === 'admin' && userRole !== 'admin') {
      throw new ForbiddenError('Admin access required', 'FORBIDDEN_ADMIN_ONLY');
    }

    if (role === 'teacher' && userRole !== 'teacher' && userRole !== 'admin') {
      throw new ForbiddenError('Teacher access required', 'FORBIDDEN_TEACHER_ONLY');
    }

    await next();
  });
