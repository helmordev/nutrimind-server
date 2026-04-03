import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { studentLoginSchema, studentRefreshSchema } from '@/features/auth/auth.schema';
import { loginStudent, logoutStudent, refreshStudentToken } from '@/features/auth/auth.service';
import { successResponse } from '@/shared/lib/response';
import { rateLimit } from '@/shared/middleware/rate-limit';
import { studentAuthMiddleware } from '@/shared/middleware/student-auth';
// Import for ContextVariableMap augmentation
import '@/features/auth/auth.types';

const app = new Hono();

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

app.post(
  '/refresh',
  rateLimit({
    max: 10,
    windowSec: 60,
    keyPrefix: 'student_refresh',
    identifier: (c) =>
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
      c.req.header('cf-connecting-ip') ??
      'anon',
  }),
  zValidator('json', studentRefreshSchema),
  async (c) => {
    const { refreshToken } = c.req.valid('json');
    const tokens = await refreshStudentToken(refreshToken);
    return successResponse(c, tokens, 200);
  },
);

app.post('/logout', studentAuthMiddleware, async (c) => {
  const student = c.get('student');
  const authorization = c.req.header('Authorization')!;
  const accessToken = authorization.slice(7);
  await logoutStudent(accessToken, student);
  return successResponse(c, { message: 'Logged out successfully' });
});

export default app;
