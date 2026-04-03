import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import {
  changeRoleSchema,
  createTeacherSchema,
  updateTeacherSchema,
} from '@/features/admin/admin.schema';
import {
  changeTeacherRole,
  createTeacher,
  deactivateTeacher,
  getTeacherById,
  listTeachers,
  updateTeacher,
} from '@/features/admin/admin.service';
import { successResponse } from '@/shared/lib/response';
import { betterAuthMiddleware } from '@/shared/middleware/better-auth';
import { requireRole } from '@/shared/middleware/role';
// Import for ContextVariableMap augmentation
import '@/features/auth/auth.types';

const app = new Hono();

// All admin routes require a valid Better Auth session and "admin" role
app.use(betterAuthMiddleware);
app.use(requireRole('admin'));

// GET /api/v1/admin/teachers
app.get('/teachers', async (_c) => {
  const teachers = await listTeachers();
  return successResponse(_c, teachers);
});

// POST /api/v1/admin/teachers
app.post('/teachers', zValidator('json', createTeacherSchema), async (c) => {
  const data = c.req.valid('json');
  const teacher = await createTeacher(data, c.req.raw.headers);
  return successResponse(c, teacher, 201);
});

// GET /api/v1/admin/teachers/:id
app.get('/teachers/:id', async (c) => {
  const teacher = await getTeacherById(c.req.param('id'));
  return successResponse(c, teacher);
});

// PATCH /api/v1/admin/teachers/:id
app.patch('/teachers/:id', zValidator('json', updateTeacherSchema), async (c) => {
  const data = c.req.valid('json');
  const teacher = await updateTeacher(c.req.param('id'), data);
  return successResponse(c, teacher);
});

// DELETE /api/v1/admin/teachers/:id — soft-deactivate (sets banned = true)
app.delete('/teachers/:id', async (c) => {
  await deactivateTeacher(c.req.param('id'));
  return successResponse(c, { message: 'Teacher deactivated successfully' });
});

// PATCH /api/v1/admin/teachers/:id/role
app.patch('/teachers/:id/role', zValidator('json', changeRoleSchema), async (c) => {
  const { role } = c.req.valid('json');
  const teacher = await changeTeacherRole(c.req.param('id'), role);
  return successResponse(c, teacher);
});

export default app;
