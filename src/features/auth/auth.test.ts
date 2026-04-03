import { beforeAll, describe, expect, it, mock } from 'bun:test';

// ── Mock rate-limit — must be declared before app import ─────────────────────
mock.module('@/shared/middleware/rate-limit', () => ({
  rateLimit: () => async (_c: unknown, next: () => Promise<void>) => next(),
}));

// ── Mock auth service ─────────────────────────────────────────────────────────
// Only mock the functions the route handlers actually call.
// signAccessToken / signRefreshToken are not called directly by any handler.
mock.module('@/features/auth/auth.service', () => ({
  verifyStudentToken: mock(async (token: string) => {
    if (token === 'valid-access-token') {
      return { sub: '2024-0001', firstName: 'Test', lastName: 'Student', type: 'access' };
    }
    const { AuthError } = require('@/shared/lib/errors');
    throw new AuthError('Invalid or expired token', 'AUTH_INVALID_TOKEN');
  }),
  loginStudent: mock(async () => {
    const { NotFoundError } = require('@/shared/lib/errors');
    throw new NotFoundError('Student login is not yet available', 'NOT_IMPLEMENTED');
  }),
  refreshStudentToken: mock(async (token: string) => {
    if (token === 'valid-refresh-token') {
      return { accessToken: 'new-access-token', refreshToken: 'new-refresh-token', expiresIn: 900 };
    }
    const { AuthError } = require('@/shared/lib/errors');
    throw new AuthError('Invalid or expired token', 'AUTH_INVALID_TOKEN');
  }),
}));

// ── Mock student-auth middleware ──────────────────────────────────────────────
mock.module('@/shared/middleware/student-auth', () => ({
  studentAuthMiddleware: async (
    c: { set: (k: string, v: unknown) => void; req: { header: (k: string) => string | undefined } },
    next: () => Promise<void>,
  ) => {
    const header = c.req.header('Authorization');
    if (header === 'Bearer valid-access-token') {
      c.set('student', {
        sub: '2024-0001',
        firstName: 'Test',
        lastName: 'Student',
        type: 'access',
      });
      return next();
    }
    const { AuthError } = require('@/shared/lib/errors');
    throw new AuthError('Bearer token required', 'AUTH_REQUIRED');
  },
}));

// ── Lazy app import (after mocks are registered) ──────────────────────────────
let app: typeof import('@/app').default;
beforeAll(async () => {
  app = (await import('@/app')).default;
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/v1/students/auth/login', () => {
  it('returns 404 NOT_IMPLEMENTED (Sprint 1 stub)', async () => {
    const res = await app.request('/api/v1/students/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: '2024-0001', pin: '123456' }),
    });

    expect(res.status).toBe(404);
    const body = (await res.json()) as { success: boolean; error: { code: string } };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_IMPLEMENTED');
  });

  it('returns 400 on invalid PIN format (not 6 digits)', async () => {
    const res = await app.request('/api/v1/students/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: '2024-0001', pin: 'abc' }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(false);
  });

  it('returns 400 when studentId is missing', async () => {
    const res = await app.request('/api/v1/students/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '123456' }),
    });

    expect(res.status).toBe(400);
  });

  it('returns 400 when PIN is missing', async () => {
    const res = await app.request('/api/v1/students/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: '2024-0001' }),
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/students/auth/refresh', () => {
  it('returns new token pair on valid refresh token', async () => {
    const res = await app.request('/api/v1/students/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: 'valid-refresh-token' }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: { accessToken: string; refreshToken: string; expiresIn: number };
    };
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBe('new-access-token');
    expect(body.data.refreshToken).toBe('new-refresh-token');
    expect(body.data.expiresIn).toBe(900);
  });

  it('returns 401 on invalid refresh token', async () => {
    const res = await app.request('/api/v1/students/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: 'bad-token' }),
    });

    expect(res.status).toBe(401);
    const body = (await res.json()) as { success: boolean; error: { code: string } };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('AUTH_INVALID_TOKEN');
  });

  it('returns 400 when refreshToken is missing', async () => {
    const res = await app.request('/api/v1/students/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/students/auth/logout', () => {
  it('returns 200 with success message on valid token', async () => {
    const res = await app.request('/api/v1/students/auth/logout', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-access-token' },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: { message: string } };
    expect(body.success).toBe(true);
    expect(body.data.message).toBe('Logged out successfully');
  });

  it('returns 401 without Authorization header', async () => {
    const res = await app.request('/api/v1/students/auth/logout', {
      method: 'POST',
    });

    expect(res.status).toBe(401);
    const body = (await res.json()) as { success: boolean; error: { code: string } };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('AUTH_REQUIRED');
  });
});
