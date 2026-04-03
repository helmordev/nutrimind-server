import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import {
  batchCreateStudentSchema,
  createStudentSchema,
  resetPinSchema,
  updateStudentSchema,
} from '@/features/student/student.schema';
import {
  batchCreateStudents,
  createStudent,
  getStudentById,
  listStudentsByHub,
  resetStudentPin,
  softDeleteStudent,
  updateStudent,
} from '@/features/student/student.service';
import { successResponse } from '@/shared/lib/response';
import { betterAuthMiddleware } from '@/shared/middleware/better-auth';
import { requireRole } from '@/shared/middleware/role';

const uuidParamSchema = z.object({ id: z.string().uuid() });
const listQuerySchema = z.object({ hubId: z.string().uuid().optional() });

const app = new Hono();

app.use(betterAuthMiddleware);
app.use(requireRole('teacher'));

app.post('/', zValidator('json', createStudentSchema), async (c) => {
  const body = c.req.valid('json');
  const student = await createStudent(body);
  return successResponse(c, student, 201);
});

app.post('/batch', zValidator('json', batchCreateStudentSchema), async (c) => {
  const body = c.req.valid('json');
  const result = await batchCreateStudents(body);
  return successResponse(c, result, 201);
});

app.get('/', zValidator('query', listQuerySchema), async (c) => {
  const { hubId } = c.req.valid('query');
  const students = hubId ? await listStudentsByHub(hubId) : [];
  return successResponse(c, students);
});

app.get('/:id', zValidator('param', uuidParamSchema), async (c) => {
  const { id } = c.req.valid('param');
  const student = await getStudentById(id);
  return successResponse(c, student);
});

app.patch(
  '/:id',
  zValidator('param', uuidParamSchema),
  zValidator('json', updateStudentSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const student = await updateStudent(id, body);
    return successResponse(c, student);
  },
);

app.post(
  '/:id/reset-pin',
  zValidator('param', uuidParamSchema),
  zValidator('json', resetPinSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    await resetStudentPin(id, body);
    return successResponse(c, { message: 'PIN reset successfully' });
  },
);

app.delete('/:id', zValidator('param', uuidParamSchema), async (c) => {
  const { id } = c.req.valid('param');
  await softDeleteStudent(id);
  return successResponse(c, { message: 'Student deleted' });
});

export default app;
