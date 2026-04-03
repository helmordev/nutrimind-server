import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import {
  createHubSchema,
  generateCodeSchema,
  joinHubSchema,
  updateHubSchema,
} from '@/features/hub/hub.schema';
import {
  createHub,
  generateCode,
  getHubById,
  getHubServerCodes,
  joinHub,
  listHubMembers,
  listHubsByTeacher,
  removeHubMember,
  revokeServerCode,
  softDeleteHub,
  updateHub,
} from '@/features/hub/hub.service';
import { successResponse } from '@/shared/lib/response';
import { betterAuthMiddleware } from '@/shared/middleware/better-auth';
import { requireRole } from '@/shared/middleware/role';
import { studentAuthMiddleware } from '@/shared/middleware/student-auth';

const uuidParamSchema = z.object({ id: z.string().uuid() });
const hubCodeParamSchema = z.object({ id: z.string().uuid(), codeId: z.string().uuid() });
const hubMemberParamSchema = z.object({ id: z.string().uuid(), studentId: z.string().uuid() });

const app = new Hono();

// Student route — join a hub via server code: must be declared before teacher middleware
app.post('/join', studentAuthMiddleware, zValidator('json', joinHubSchema), async (c) => {
  const student = c.get('student');
  const body = c.req.valid('json');
  const member = await joinHub(student.sub, body);
  return successResponse(c, member, 201);
});

app.use(betterAuthMiddleware);
app.use(requireRole('teacher'));

app.post('/', zValidator('json', createHubSchema), async (c) => {
  const user = c.get('user');
  const body = c.req.valid('json');
  const hub = await createHub(user.id, body);
  return successResponse(c, hub, 201);
});

app.get('/', async (c) => {
  const user = c.get('user');
  const hubs = await listHubsByTeacher(user.id);
  return successResponse(c, hubs);
});

app.get('/:id', zValidator('param', uuidParamSchema), async (c) => {
  const { id } = c.req.valid('param');
  const hub = await getHubById(id);
  return successResponse(c, hub);
});

app.patch(
  '/:id',
  zValidator('param', uuidParamSchema),
  zValidator('json', updateHubSchema),
  async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const hub = await updateHub(id, user.id, body);
    return successResponse(c, hub);
  },
);

app.delete('/:id', zValidator('param', uuidParamSchema), async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');
  await softDeleteHub(id, user.id);
  return successResponse(c, { message: 'Hub deleted' });
});

app.post(
  '/:id/codes',
  zValidator('param', uuidParamSchema),
  zValidator('json', generateCodeSchema),
  async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const code = await generateCode(id, user.id, body);
    return successResponse(c, code, 201);
  },
);

app.get('/:id/codes', zValidator('param', uuidParamSchema), async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');
  const codes = await getHubServerCodes(id, user.id);
  return successResponse(c, codes);
});

app.delete('/:id/codes/:codeId', zValidator('param', hubCodeParamSchema), async (c) => {
  const user = c.get('user');
  const { id, codeId } = c.req.valid('param');
  await revokeServerCode(id, codeId, user.id);
  return successResponse(c, { message: 'Server code revoked' });
});

app.get('/:id/members', zValidator('param', uuidParamSchema), async (c) => {
  const { id } = c.req.valid('param');
  const members = await listHubMembers(id);
  return successResponse(c, members);
});

app.delete('/:id/members/:studentId', zValidator('param', hubMemberParamSchema), async (c) => {
  const user = c.get('user');
  const { id, studentId } = c.req.valid('param');
  await removeHubMember(id, studentId, user.id);
  return successResponse(c, { message: 'Member removed from hub' });
});

export default app;
