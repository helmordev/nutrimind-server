import { beforeAll, describe, expect, it, mock } from 'bun:test';

// ── Mocks must be declared before any route/app import ────────────────────────

mock.module('@/shared/middleware/rate-limit', () => ({
  rateLimit: () => async (_c: unknown, next: () => Promise<void>) => next(),
}));

mock.module('@/shared/middleware/better-auth', () => ({
  betterAuthMiddleware: async (
    c: { set: (k: string, v: unknown) => void },
    next: () => Promise<void>,
  ) => {
    c.set('user', { id: 'teacher-uuid-001', role: 'teacher' });
    c.set('session', { id: 'session-001' });
    return next();
  },
}));

mock.module('@/shared/middleware/role', () => ({
  requireRole: (_role: string) => async (_c: unknown, next: () => Promise<void>) => next(),
}));

const STUDENT_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const HUB_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

const mockStudent = {
  id: STUDENT_UUID,
  studentId: '2024-0001',
  firstName: 'Alice',
  lastName: 'Santos',
  hubId: HUB_UUID,
  lastLoginAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

mock.module('@/features/student/student.service', () => ({
  createStudent: mock(async () => mockStudent),
  batchCreateStudents: mock(async () => ({
    created: [mockStudent],
    failed: [],
  })),
  getStudentById: mock(async (id: string) => {
    if (id === STUDENT_UUID) return mockStudent;
    const { NotFoundError } = require('@/shared/lib/errors');
    throw new NotFoundError('Student not found', 'STUDENT_NOT_FOUND');
  }),
  listStudentsByHub: mock(async () => [mockStudent]),
  updateStudent: mock(async (id: string) => {
    if (id === STUDENT_UUID) return { ...mockStudent, firstName: 'Alicia' };
    const { NotFoundError } = require('@/shared/lib/errors');
    throw new NotFoundError('Student not found', 'STUDENT_NOT_FOUND');
  }),
  resetStudentPin: mock(async (id: string) => {
    if (id !== STUDENT_UUID) {
      const { NotFoundError } = require('@/shared/lib/errors');
      throw new NotFoundError('Student not found', 'STUDENT_NOT_FOUND');
    }
  }),
  softDeleteStudent: mock(async (id: string) => {
    if (id !== STUDENT_UUID) {
      const { NotFoundError } = require('@/shared/lib/errors');
      throw new NotFoundError('Student not found', 'STUDENT_NOT_FOUND');
    }
  }),
}));

// ── Build a minimal test app using only student routes ────────────────────────
// This avoids shared app.ts module-cache interference across test files.
import { Hono } from 'hono';
import { errorHandler } from '@/shared/middleware/error-handler';

let app: Hono;
beforeAll(async () => {
  const { default: studentRoutes } = await import('@/features/student/student.routes');
  app = new Hono();
  app.route('/api/v1/students', studentRoutes);
  app.onError(errorHandler);
});

describe('POST /api/v1/students', () => {
  it('creates a student and returns 201', async () => {
    const res = await app.request('/api/v1/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: '2024-0001',
        firstName: 'Alice',
        lastName: 'Santos',
        pin: '123456',
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as { success: boolean; data: typeof mockStudent };
    expect(body.success).toBe(true);
    expect(body.data.studentId).toBe('2024-0001');
  });

  it('returns 400 when PIN is not 6 digits', async () => {
    const res = await app.request('/api/v1/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: '2024-0001',
        firstName: 'Alice',
        lastName: 'Santos',
        pin: 'abc',
      }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(false);
  });

  it('returns 400 when firstName is missing', async () => {
    const res = await app.request('/api/v1/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: '2024-0001', lastName: 'Santos', pin: '123456' }),
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/students/batch', () => {
  it('creates students in batch and returns 201', async () => {
    const res = await app.request('/api/v1/students/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        students: [
          { studentId: '2024-0001', firstName: 'Alice', lastName: 'Santos', pin: '123456' },
        ],
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      success: boolean;
      data: { created: unknown[]; failed: unknown[] };
    };
    expect(body.success).toBe(true);
    expect(body.data.created).toHaveLength(1);
    expect(body.data.failed).toHaveLength(0);
  });

  it('returns 400 when students array is empty', async () => {
    const res = await app.request('/api/v1/students/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students: [] }),
    });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/students', () => {
  it('returns students for a given hubId', async () => {
    const res = await app.request(`/api/v1/students?hubId=${HUB_UUID}`);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: unknown[] };
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('returns empty array when hubId is omitted', async () => {
    const res = await app.request('/api/v1/students');

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: unknown[] };
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it('returns 400 when hubId is not a valid UUID', async () => {
    const res = await app.request('/api/v1/students?hubId=not-a-uuid');

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/students/:id', () => {
  it('returns a student by UUID', async () => {
    const res = await app.request(`/api/v1/students/${STUDENT_UUID}`);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: typeof mockStudent };
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(STUDENT_UUID);
  });

  it('returns 404 for an unknown UUID', async () => {
    const res = await app.request('/api/v1/students/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99');

    expect(res.status).toBe(404);
    const body = (await res.json()) as { success: boolean; error: { code: string } };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('STUDENT_NOT_FOUND');
  });

  it('returns 400 for an invalid UUID param', async () => {
    const res = await app.request('/api/v1/students/not-a-uuid');

    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/v1/students/:id', () => {
  it('updates a student and returns 200', async () => {
    const res = await app.request(`/api/v1/students/${STUDENT_UUID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: 'Alicia' }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: { firstName: string } };
    expect(body.success).toBe(true);
    expect(body.data.firstName).toBe('Alicia');
  });

  it('returns 404 for an unknown student', async () => {
    const res = await app.request('/api/v1/students/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: 'Ghost' }),
    });

    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/students/:id/reset-pin', () => {
  it('resets PIN and returns 200', async () => {
    const res = await app.request(`/api/v1/students/${STUDENT_UUID}/reset-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPin: '654321' }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: { message: string } };
    expect(body.success).toBe(true);
    expect(body.data.message).toBe('PIN reset successfully');
  });

  it('returns 400 when newPin is not 6 digits', async () => {
    const res = await app.request(`/api/v1/students/${STUDENT_UUID}/reset-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPin: 'abc' }),
    });

    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown student', async () => {
    const res = await app.request(
      '/api/v1/students/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99/reset-pin',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPin: '654321' }),
      },
    );

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/students/:id', () => {
  it('soft-deletes a student and returns 200', async () => {
    const res = await app.request(`/api/v1/students/${STUDENT_UUID}`, {
      method: 'DELETE',
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: { message: string } };
    expect(body.success).toBe(true);
    expect(body.data.message).toBe('Student deleted');
  });

  it('returns 404 for an unknown student', async () => {
    const res = await app.request('/api/v1/students/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', {
      method: 'DELETE',
    });

    expect(res.status).toBe(404);
  });
});
