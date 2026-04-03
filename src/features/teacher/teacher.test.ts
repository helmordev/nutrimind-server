import { beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';

// ── Shared mock user fixtures ─────────────────────────────────────────────────

const mockTeacherProfile = {
  id: 'teacher-id-001',
  email: 'teacher@school.edu',
  name: 'Jane Doe',
  firstName: 'Jane',
  lastName: 'Doe',
  school: 'Springfield Elementary',
  emailVerified: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// ── Mock Better Auth middleware — before app import ───────────────────────────
mock.module('@/shared/middleware/better-auth', () => ({
  betterAuthMiddleware: async (
    c: { set: (k: string, v: unknown) => void; req: { header: (k: string) => string | undefined } },
    next: () => Promise<void>,
  ) => {
    const sessionToken = c.req.header('x-test-session');
    if (sessionToken === 'teacher-session') {
      c.set('user', {
        id: 'teacher-id-001',
        email: 'teacher@school.edu',
        name: 'Jane Doe',
        firstName: 'Jane',
        lastName: 'Doe',
        school: 'Springfield Elementary',
        role: 'teacher',
        banned: null,
        emailVerified: true,
      });
      c.set('session', { id: 'session-001', userId: 'teacher-id-001' });
      return next();
    }
    if (sessionToken === 'admin-session') {
      c.set('user', {
        id: 'admin-id-001',
        email: 'admin@nutrimind.edu',
        name: 'Super Admin',
        role: 'admin',
        banned: null,
        emailVerified: true,
      });
      c.set('session', { id: 'session-002', userId: 'admin-id-001' });
      return next();
    }
    const { AuthError } = require('@/shared/lib/errors');
    throw new AuthError('Authentication required', 'AUTH_REQUIRED');
  },
}));

// ── Mock teacher service — before app import ──────────────────────────────────
const mockGetTeacherProfile = mock(async (id: string) => {
  if (id === 'teacher-id-001') return { ...mockTeacherProfile };
  const { NotFoundError } = require('@/shared/lib/errors');
  throw new NotFoundError('Teacher not found', 'TEACHER_NOT_FOUND');
});

const mockUpdateTeacherProfile = mock(
  async (id: string, data: { firstName?: string; lastName?: string; school?: string | null }) => {
    if (id === 'teacher-id-001') {
      const updated = {
        ...mockTeacherProfile,
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.school !== undefined && { school: data.school }),
      };
      updated.name = `${updated.firstName} ${updated.lastName}`;
      return updated;
    }
    const { NotFoundError } = require('@/shared/lib/errors');
    throw new NotFoundError('Teacher not found', 'TEACHER_NOT_FOUND');
  },
);

mock.module('@/features/teacher/teacher.service', () => ({
  getTeacherProfile: mockGetTeacherProfile,
  updateTeacherProfile: mockUpdateTeacherProfile,
}));

// ── Lazy app import (after mocks) ─────────────────────────────────────────────
let app: typeof import('@/app').default;
beforeAll(async () => {
  app = (await import('@/app')).default;
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/v1/teachers/me', () => {
  it('returns teacher profile for authenticated teacher', async () => {
    const res = await app.request('/api/v1/teachers/me', {
      headers: { 'x-test-session': 'teacher-session' },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: typeof mockTeacherProfile };
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('teacher-id-001');
    expect(body.data.email).toBe('teacher@school.edu');
    expect(body.data.firstName).toBe('Jane');
    expect(body.data.lastName).toBe('Doe');
  });

  it('returns 401 without session', async () => {
    const res = await app.request('/api/v1/teachers/me');

    expect(res.status).toBe(401);
    const body = (await res.json()) as { success: boolean; error: { code: string } };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('AUTH_REQUIRED');
  });

  it('returns 403 for admin accessing teacher route', async () => {
    const res = await app.request('/api/v1/teachers/me', {
      headers: { 'x-test-session': 'admin-session' },
    });

    expect(res.status).toBe(403);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(false);
  });
});

describe('PATCH /api/v1/teachers/me', () => {
  beforeEach(() => mockUpdateTeacherProfile.mockClear());

  it('updates teacher profile and returns updated data', async () => {
    const res = await app.request('/api/v1/teachers/me', {
      method: 'PATCH',
      headers: {
        'x-test-session': 'teacher-session',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ firstName: 'Janet', school: 'Shelbyville High' }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: { firstName: string; school: string };
    };
    expect(body.success).toBe(true);
    expect(body.data.firstName).toBe('Janet');
    expect(body.data.school).toBe('Shelbyville High');
    expect(mockUpdateTeacherProfile).toHaveBeenCalledTimes(1);
  });

  it('allows clearing the school field with null', async () => {
    const res = await app.request('/api/v1/teachers/me', {
      method: 'PATCH',
      headers: {
        'x-test-session': 'teacher-session',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ school: null }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: { school: string | null } };
    expect(body.success).toBe(true);
    expect(body.data.school).toBeNull();
  });

  it('returns 400 on invalid firstName (empty string)', async () => {
    const res = await app.request('/api/v1/teachers/me', {
      method: 'PATCH',
      headers: {
        'x-test-session': 'teacher-session',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ firstName: '' }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(false);
  });

  it('returns 401 without session', async () => {
    const res = await app.request('/api/v1/teachers/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: 'Janet' }),
    });

    expect(res.status).toBe(401);
  });
});
