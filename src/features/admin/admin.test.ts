import { beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';

const mockTeacher1 = {
  id: 'teacher-id-001',
  email: 'teacher1@school.edu',
  name: 'Jane Doe',
  firstName: 'Jane',
  lastName: 'Doe',
  school: 'Springfield Elementary',
  role: 'teacher',
  banned: null,
  banReason: null,
  emailVerified: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockTeacher2 = {
  id: 'teacher-id-002',
  email: 'teacher2@school.edu',
  name: 'John Smith',
  firstName: 'John',
  lastName: 'Smith',
  school: 'Shelbyville High',
  role: 'teacher',
  banned: null,
  banReason: null,
  emailVerified: false,
  createdAt: new Date('2024-01-02'),
  updatedAt: new Date('2024-01-02'),
};

// ── Mock Better Auth middleware — before route import ─────────────────────────
mock.module('@/shared/middleware/better-auth', () => ({
  betterAuthMiddleware: async (
    c: { set: (k: string, v: unknown) => void; req: { header: (k: string) => string | undefined } },
    next: () => Promise<void>,
  ) => {
    const sessionToken = c.req.header('x-test-session');
    if (sessionToken === 'admin-session') {
      c.set('user', {
        id: 'admin-id-001',
        email: 'admin@nutrimind.edu',
        name: 'Super Admin',
        role: 'admin',
        banned: null,
        emailVerified: true,
      });
      c.set('session', { id: 'session-001', userId: 'admin-id-001' });
      return next();
    }
    if (sessionToken === 'teacher-session') {
      c.set('user', { ...mockTeacher1 });
      c.set('session', { id: 'session-002', userId: 'teacher-id-001' });
      return next();
    }
    const { AuthError } = require('@/shared/lib/errors');
    throw new AuthError('Authentication required', 'AUTH_REQUIRED');
  },
}));

mock.module('@/shared/middleware/role', () => ({
  requireRole:
    (role: string) =>
    async (c: { get: (k: string) => { role?: string } }, next: () => Promise<void>) => {
      const user = c.get('user') as { role?: string } | undefined;
      if (!user) {
        const { AuthError } = require('@/shared/lib/errors');
        throw new AuthError('Authentication required', 'AUTH_REQUIRED');
      }
      if (user.role !== role) {
        const { ForbiddenError } = require('@/shared/lib/errors');
        throw new ForbiddenError(`${role} access only`, 'FORBIDDEN_ADMIN_ONLY');
      }
      return next();
    },
}));

// ── Mock admin service — before route import ──────────────────────────────────
const mockListTeachers = mock(async () => ({ teachers: [mockTeacher1, mockTeacher2], total: 2 }));

const mockGetTeacherById = mock(async (id: string) => {
  if (id === 'teacher-id-001') return { ...mockTeacher1 };
  const { NotFoundError } = require('@/shared/lib/errors');
  throw new NotFoundError('Teacher not found', 'TEACHER_NOT_FOUND');
});

const mockCreateTeacher = mock(
  async (data: { email: string; firstName: string; lastName: string; school?: string }) => ({
    id: 'teacher-id-new',
    email: data.email,
    name: `${data.firstName} ${data.lastName}`,
    firstName: data.firstName,
    lastName: data.lastName,
    school: data.school ?? null,
    role: 'teacher',
    banned: null,
    banReason: null,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
);

const mockUpdateTeacher = mock(async (id: string, data: Record<string, unknown>) => {
  if (id === 'teacher-id-001') return { ...mockTeacher1, ...data };
  const { NotFoundError } = require('@/shared/lib/errors');
  throw new NotFoundError('Teacher not found', 'TEACHER_NOT_FOUND');
});

const mockDeactivateTeacher = mock(async (id: string) => {
  if (id !== 'teacher-id-001') {
    const { NotFoundError } = require('@/shared/lib/errors');
    throw new NotFoundError('Teacher not found', 'TEACHER_NOT_FOUND');
  }
});

const mockChangeTeacherRole = mock(async (id: string, role: string) => {
  if (id === 'teacher-id-001') return { ...mockTeacher1, role };
  const { NotFoundError } = require('@/shared/lib/errors');
  throw new NotFoundError('Teacher not found', 'TEACHER_NOT_FOUND');
});

mock.module('@/features/admin/admin.service', () => ({
  listTeachers: mockListTeachers,
  getTeacherById: mockGetTeacherById,
  createTeacher: mockCreateTeacher,
  updateTeacher: mockUpdateTeacher,
  deactivateTeacher: mockDeactivateTeacher,
  changeTeacherRole: mockChangeTeacherRole,
}));

// ── Build a minimal test app using only admin routes ──────────────────────────
// This avoids shared app.ts module-cache interference across test files.
import { Hono } from 'hono';
import { errorHandler } from '@/shared/middleware/error-handler';

let app: Hono;
beforeAll(async () => {
  const { default: adminRoutes } = await import('@/features/admin/admin.routes');
  app = new Hono();
  app.route('/api/v1/admin', adminRoutes);
  app.onError(errorHandler);
});

function adminHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { 'x-test-session': 'admin-session', ...extra };
}

describe('GET /api/v1/admin/teachers', () => {
  it('returns list of teachers for admin', async () => {
    const res = await app.request('/api/v1/admin/teachers', {
      headers: adminHeaders(),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: unknown[] };
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(2);
  });

  it('returns 401 without session', async () => {
    const res = await app.request('/api/v1/admin/teachers');

    expect(res.status).toBe(401);
    const body = (await res.json()) as { success: boolean; error: { code: string } };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('AUTH_REQUIRED');
  });

  it('returns 403 for non-admin user', async () => {
    const res = await app.request('/api/v1/admin/teachers', {
      headers: { 'x-test-session': 'teacher-session' },
    });

    expect(res.status).toBe(403);
    const body = (await res.json()) as { success: boolean; error: { code: string } };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FORBIDDEN_ADMIN_ONLY');
  });
});

describe('POST /api/v1/admin/teachers', () => {
  beforeEach(() => mockCreateTeacher.mockClear());

  it('creates a teacher and returns 201', async () => {
    const res = await app.request('/api/v1/admin/teachers', {
      method: 'POST',
      headers: adminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        email: 'new@school.edu',
        password: 'Password@123',
        firstName: 'Alice',
        lastName: 'Walker',
        school: 'New School',
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as { success: boolean; data: { email: string; role: string } };
    expect(body.success).toBe(true);
    expect(body.data.email).toBe('new@school.edu');
    expect(body.data.role).toBe('teacher');
    expect(mockCreateTeacher).toHaveBeenCalledTimes(1);
  });

  it('returns 400 for invalid email', async () => {
    const res = await app.request('/api/v1/admin/teachers', {
      method: 'POST',
      headers: adminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        email: 'not-an-email',
        password: 'Password@123',
        firstName: 'Alice',
        lastName: 'Walker',
      }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(false);
  });

  it('returns 400 for password shorter than 8 chars', async () => {
    const res = await app.request('/api/v1/admin/teachers', {
      method: 'POST',
      headers: adminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        email: 'new@school.edu',
        password: 'short',
        firstName: 'Alice',
        lastName: 'Walker',
      }),
    });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/admin/teachers/:id', () => {
  it('returns teacher by id', async () => {
    const res = await app.request('/api/v1/admin/teachers/teacher-id-001', {
      headers: adminHeaders(),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: { id: string } };
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('teacher-id-001');
  });

  it('returns 404 for unknown id', async () => {
    const res = await app.request('/api/v1/admin/teachers/unknown-id', {
      headers: adminHeaders(),
    });

    expect(res.status).toBe(404);
    const body = (await res.json()) as { success: boolean; error: { code: string } };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('TEACHER_NOT_FOUND');
  });
});

describe('PATCH /api/v1/admin/teachers/:id', () => {
  beforeEach(() => mockUpdateTeacher.mockClear());

  it('updates teacher and returns updated data', async () => {
    const res = await app.request('/api/v1/admin/teachers/teacher-id-001', {
      method: 'PATCH',
      headers: adminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ firstName: 'Janet', school: null }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: { firstName: string } };
    expect(body.success).toBe(true);
    expect(body.data.firstName).toBe('Janet');
    expect(mockUpdateTeacher).toHaveBeenCalledTimes(1);
  });

  it('returns 404 for unknown id', async () => {
    const res = await app.request('/api/v1/admin/teachers/unknown-id', {
      method: 'PATCH',
      headers: adminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ firstName: 'Janet' }),
    });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/admin/teachers/:id', () => {
  beforeEach(() => mockDeactivateTeacher.mockClear());

  it('deactivates teacher and returns success message', async () => {
    const res = await app.request('/api/v1/admin/teachers/teacher-id-001', {
      method: 'DELETE',
      headers: adminHeaders(),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: { message: string } };
    expect(body.success).toBe(true);
    expect(body.data.message).toBe('Teacher deactivated successfully');
    expect(mockDeactivateTeacher).toHaveBeenCalledTimes(1);
  });

  it('returns 404 for unknown id', async () => {
    const res = await app.request('/api/v1/admin/teachers/unknown-id', {
      method: 'DELETE',
      headers: adminHeaders(),
    });

    expect(res.status).toBe(404);
    const body = (await res.json()) as { success: boolean; error: { code: string } };
    expect(body.error.code).toBe('TEACHER_NOT_FOUND');
  });
});

describe('PATCH /api/v1/admin/teachers/:id/role', () => {
  beforeEach(() => mockChangeTeacherRole.mockClear());

  it('promotes teacher to admin', async () => {
    const res = await app.request('/api/v1/admin/teachers/teacher-id-001/role', {
      method: 'PATCH',
      headers: adminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ role: 'admin' }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: { role: string } };
    expect(body.success).toBe(true);
    expect(body.data.role).toBe('admin');
    expect(mockChangeTeacherRole).toHaveBeenCalledTimes(1);
  });

  it('returns 400 for invalid role value', async () => {
    const res = await app.request('/api/v1/admin/teachers/teacher-id-001/role', {
      method: 'PATCH',
      headers: adminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ role: 'student' }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(false);
  });

  it('returns 404 for unknown teacher id', async () => {
    const res = await app.request('/api/v1/admin/teachers/unknown-id/role', {
      method: 'PATCH',
      headers: adminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ role: 'teacher' }),
    });

    expect(res.status).toBe(404);
  });
});
