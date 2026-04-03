import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import {
  changeRoleSchema,
  createTeacherSchema,
  paginationQuerySchema,
  teacherIdParamSchema,
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

app.use(betterAuthMiddleware);
app.use(requireRole('admin'));

app.get('/teachers', zValidator('query', paginationQuerySchema), async (c) => {
  const pagination = c.req.valid('query');
  const { teachers, total } = await listTeachers(pagination);
  return successResponse(c, teachers, 200, {
    page: pagination.page,
    limit: pagination.limit,
    total,
    totalPages: Math.ceil(total / pagination.limit),
  });
});

app.post('/teachers', zValidator('json', createTeacherSchema), async (c) => {
  const data = c.req.valid('json');
  const teacher = await createTeacher(data, c.req.raw.headers);
  return successResponse(c, teacher, 201);
});

app.get('/teachers/:id', zValidator('param', teacherIdParamSchema), async (c) => {
  const { id } = c.req.valid('param');
  const teacher = await getTeacherById(id);
  return successResponse(c, teacher);
});

app.patch(
  '/teachers/:id',
  zValidator('param', teacherIdParamSchema),
  zValidator('json', updateTeacherSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');
    const teacher = await updateTeacher(id, data);
    return successResponse(c, teacher);
  },
);

app.delete('/teachers/:id', zValidator('param', teacherIdParamSchema), async (c) => {
  const { id } = c.req.valid('param');
  await deactivateTeacher(id);
  return successResponse(c, { message: 'Teacher deactivated successfully' });
});

app.patch(
  '/teachers/:id/role',
  zValidator('param', teacherIdParamSchema),
  zValidator('json', changeRoleSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const { role } = c.req.valid('json');
    const teacher = await changeTeacherRole(id, role);
    return successResponse(c, teacher);
  },
);

export default app;
