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

// Student auth mock — injects student UUID as `sub`
const STUDENT_UUID = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b11';
mock.module('@/shared/middleware/student-auth', () => ({
  studentAuthMiddleware: async (
    c: {
      set: (k: string, v: unknown) => void;
      req: { header: (k: string) => string | undefined };
    },
    next: () => Promise<void>,
  ) => {
    const header = c.req.header('Authorization');
    if (header === 'Bearer valid-student-token') {
      c.set('student', {
        sub: STUDENT_UUID,
        studentId: '2024-0010',
        firstName: 'Bob',
        type: 'access',
      });
      return next();
    }
    const { AuthError } = require('@/shared/lib/errors');
    throw new AuthError('Bearer token required', 'AUTH_REQUIRED');
  },
}));

const TEACHER_ID = 'teacher-uuid-001';
const HUB_UUID = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22';
const CODE_UUID = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b33';

const mockHub = {
  id: HUB_UUID,
  name: 'Grade 5 Section A',
  teacherId: TEACHER_ID,
  memberCount: 3,
  deletedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockCode = {
  id: CODE_UUID,
  hubId: HUB_UUID,
  code: 'ABC123',
  createdBy: TEACHER_ID,
  expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  createdAt: new Date().toISOString(),
};

const mockMember = {
  id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b44',
  hubId: HUB_UUID,
  studentId: STUDENT_UUID,
  joinedAt: new Date().toISOString(),
};

mock.module('@/features/hub/hub.service', () => ({
  createHub: mock(async () => mockHub),
  getHubById: mock(async (id: string) => {
    if (id === HUB_UUID) return mockHub;
    const { NotFoundError } = require('@/shared/lib/errors');
    throw new NotFoundError('Hub not found', 'HUB_NOT_FOUND');
  }),
  listHubsByTeacher: mock(async () => [mockHub]),
  updateHub: mock(async (id: string) => {
    if (id === HUB_UUID) return { ...mockHub, name: 'Grade 5 Section B' };
    const { NotFoundError } = require('@/shared/lib/errors');
    throw new NotFoundError('Hub not found', 'HUB_NOT_FOUND');
  }),
  softDeleteHub: mock(async (id: string) => {
    if (id !== HUB_UUID) {
      const { NotFoundError } = require('@/shared/lib/errors');
      throw new NotFoundError('Hub not found', 'HUB_NOT_FOUND');
    }
  }),
  generateCode: mock(async () => mockCode),
  revokeServerCode: mock(async (_hubId: string, codeId: string) => {
    if (codeId !== CODE_UUID) {
      const { NotFoundError } = require('@/shared/lib/errors');
      throw new NotFoundError('Server code not found', 'CODE_NOT_FOUND');
    }
  }),
  getHubServerCodes: mock(async () => [mockCode]),
  joinHub: mock(async () => mockMember),
  listHubMembers: mock(async () => [mockMember]),
  removeHubMember: mock(async (_hubId: string, studentId: string) => {
    if (studentId !== STUDENT_UUID) {
      const { NotFoundError } = require('@/shared/lib/errors');
      throw new NotFoundError('Student is not a member of this hub', 'HUB_MEMBER_NOT_FOUND');
    }
  }),
}));

// ── Build a minimal test app using only hub routes ────────────────────────────
// This avoids shared app.ts module-cache interference across test files.
import { Hono } from 'hono';
import { errorHandler } from '@/shared/middleware/error-handler';

let app: Hono;
beforeAll(async () => {
  const { default: hubRoutes } = await import('@/features/hub/hub.routes');
  app = new Hono();
  app.route('/api/v1/hubs', hubRoutes);
  app.onError(errorHandler);
});

describe('POST /api/v1/hubs', () => {
  it('creates a hub and returns 201', async () => {
    const res = await app.request('/api/v1/hubs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Grade 5 Section A' }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as { success: boolean; data: typeof mockHub };
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Grade 5 Section A');
  });

  it('returns 400 when name is missing', async () => {
    const res = await app.request('/api/v1/hubs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(false);
  });
});

describe('GET /api/v1/hubs', () => {
  it('returns hubs for the authenticated teacher', async () => {
    const res = await app.request('/api/v1/hubs');

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: unknown[] };
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(1);
  });
});

describe('GET /api/v1/hubs/:id', () => {
  it('returns a hub by UUID with member count', async () => {
    const res = await app.request(`/api/v1/hubs/${HUB_UUID}`);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: typeof mockHub };
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(HUB_UUID);
    expect(typeof body.data.memberCount).toBe('number');
  });

  it('returns 404 for an unknown hub', async () => {
    const res = await app.request('/api/v1/hubs/b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b99');

    expect(res.status).toBe(404);
    const body = (await res.json()) as { success: boolean; error: { code: string } };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('HUB_NOT_FOUND');
  });

  it('returns 400 for an invalid UUID param', async () => {
    const res = await app.request('/api/v1/hubs/not-a-uuid');

    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/v1/hubs/:id', () => {
  it('updates a hub name and returns 200', async () => {
    const res = await app.request(`/api/v1/hubs/${HUB_UUID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Grade 5 Section B' }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: { name: string } };
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Grade 5 Section B');
  });

  it('returns 404 for an unknown hub', async () => {
    const res = await app.request('/api/v1/hubs/b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b99', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Ghost Hub' }),
    });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/hubs/:id', () => {
  it('soft-deletes a hub and returns 200', async () => {
    const res = await app.request(`/api/v1/hubs/${HUB_UUID}`, {
      method: 'DELETE',
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: { message: string } };
    expect(body.success).toBe(true);
    expect(body.data.message).toBe('Hub deleted');
  });

  it('returns 404 for an unknown hub', async () => {
    const res = await app.request('/api/v1/hubs/b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b99', {
      method: 'DELETE',
    });

    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/hubs/:id/codes', () => {
  it('generates a server code and returns 201', async () => {
    const res = await app.request(`/api/v1/hubs/${HUB_UUID}/codes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ttlSeconds: 3600 }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as { success: boolean; data: typeof mockCode };
    expect(body.success).toBe(true);
    expect(body.data.code).toBe('ABC123');
  });

  it('generates a code with default TTL when ttlSeconds is omitted', async () => {
    const res = await app.request(`/api/v1/hubs/${HUB_UUID}/codes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(201);
  });
});

describe('GET /api/v1/hubs/:id/codes', () => {
  it('returns server codes for the hub', async () => {
    const res = await app.request(`/api/v1/hubs/${HUB_UUID}/codes`);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: unknown[] };
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
  });
});

describe('DELETE /api/v1/hubs/:id/codes/:codeId', () => {
  it('revokes a server code and returns 200', async () => {
    const res = await app.request(`/api/v1/hubs/${HUB_UUID}/codes/${CODE_UUID}`, {
      method: 'DELETE',
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: { message: string } };
    expect(body.success).toBe(true);
    expect(body.data.message).toBe('Server code revoked');
  });

  it('returns 404 for an unknown code', async () => {
    const res = await app.request(
      `/api/v1/hubs/${HUB_UUID}/codes/b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b99`,
      { method: 'DELETE' },
    );

    expect(res.status).toBe(404);
    const body = (await res.json()) as { success: boolean; error: { code: string } };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('CODE_NOT_FOUND');
  });
});

describe('POST /api/v1/hubs/join (student)', () => {
  it('joins a hub with a valid server code and returns 201', async () => {
    const res = await app.request('/api/v1/hubs/join', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-student-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'ABC123' }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as { success: boolean; data: typeof mockMember };
    expect(body.success).toBe(true);
    expect(body.data.studentId).toBe(STUDENT_UUID);
  });

  it('returns 401 without a student token', async () => {
    const res = await app.request('/api/v1/hubs/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'ABC123' }),
    });

    expect(res.status).toBe(401);
    const body = (await res.json()) as { success: boolean; error: { code: string } };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('AUTH_REQUIRED');
  });

  it('returns 400 when code is missing', async () => {
    const res = await app.request('/api/v1/hubs/join', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-student-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/hubs/:id/members', () => {
  it('returns members of a hub', async () => {
    const res = await app.request(`/api/v1/hubs/${HUB_UUID}/members`);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: unknown[] };
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
  });
});

describe('DELETE /api/v1/hubs/:id/members/:studentId', () => {
  it('removes a member from the hub', async () => {
    const res = await app.request(`/api/v1/hubs/${HUB_UUID}/members/${STUDENT_UUID}`, {
      method: 'DELETE',
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: { message: string } };
    expect(body.success).toBe(true);
    expect(body.data.message).toBe('Member removed from hub');
  });

  it('returns 404 for a student not in the hub', async () => {
    const res = await app.request(
      `/api/v1/hubs/${HUB_UUID}/members/b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b99`,
      { method: 'DELETE' },
    );

    expect(res.status).toBe(404);
    const body = (await res.json()) as { success: boolean; error: { code: string } };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('HUB_MEMBER_NOT_FOUND');
  });
});
