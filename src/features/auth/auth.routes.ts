import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { studentLoginSchema, studentRefreshSchema } from '@/features/auth/auth.schema';
import { loginStudent, refreshStudentToken } from '@/features/auth/auth.service';
import { successResponse } from '@/shared/lib/response';
import { rateLimit } from '@/shared/middleware/rate-limit';
import * as studentAuthModule from '@/shared/middleware/student-auth';
// Import for ContextVariableMap augmentation
import '@/features/auth/auth.types';

const app = new Hono();

// POST /api/v1/students/auth/login
// Rate limited by IP — 5 req/min. Stub until Sprint 2 (student table).
app.post(
  '/login',
  rateLimit({
    max: 5,
    windowSec: 60,
    keyPrefix: 'student_login',
    identifier: (c) =>
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
      c.req.header('cf-connecting-ip') ??
      'anon',
  }),
  zValidator('json', studentLoginSchema),
  async (c) => {
    const { studentId, pin } = c.req.valid('json');
    const tokens = await loginStudent(studentId, pin);
    return successResponse(c, tokens, 200);
  },
);

// POST /api/v1/students/auth/refresh
app.post('/refresh', zValidator('json', studentRefreshSchema), async (c) => {
  const { refreshToken } = c.req.valid('json');
  const tokens = await refreshStudentToken(refreshToken);
  return successResponse(c, tokens, 200);
});

// POST /api/v1/students/auth/logout
// Stateless JWT — client drops the token. Acknowledged here; blocklist added in Sprint 2.
app.post(
  '/logout',
  (c, next) => studentAuthModule.studentAuthMiddleware(c, next),
  async (c) => {
    return successResponse(c, { message: 'Logged out successfully' });
  },
);

export default app;
