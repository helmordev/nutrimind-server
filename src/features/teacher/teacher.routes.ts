import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { updateTeacherProfileSchema } from '@/features/teacher/teacher.schema';
import { getTeacherProfile, updateTeacherProfile } from '@/features/teacher/teacher.service';
import { successResponse } from '@/shared/lib/response';
import { betterAuthMiddleware } from '@/shared/middleware/better-auth';
import { requireRole } from '@/shared/middleware/role';
// Import for ContextVariableMap augmentation
import '@/features/auth/auth.types';

const app = new Hono();

app.use(betterAuthMiddleware);
app.use(requireRole('teacher'));

app.get('/me', async (c) => {
  const user = c.get('user');
  const profile = await getTeacherProfile(user.id);
  return successResponse(c, profile);
});

app.patch('/me', zValidator('json', updateTeacherProfileSchema), async (c) => {
  const user = c.get('user');
  const data = c.req.valid('json');
  const profile = await updateTeacherProfile(user.id, data);
  return successResponse(c, profile);
});

export default app;
