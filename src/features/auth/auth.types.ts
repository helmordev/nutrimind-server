import type { auth } from '@/config/auth';

// Payload stored in student JWT tokens
export interface StudentTokenPayload {
  /** School-assigned student ID, e.g. "2024-0001" */
  sub: string;
  firstName: string;
  lastName: string;
  /** Set after the student joins a hub (Sprint 2+) */
  hubId?: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  /** Access token TTL in seconds */
  expiresIn: number;
}

// Extend Hono's ContextVariableMap so c.get("user"), c.get("session"),
// and c.get("student") are fully typed throughout the app.
declare module 'hono' {
  interface ContextVariableMap {
    user: typeof auth.$Infer.Session.user;
    session: typeof auth.$Infer.Session.session;
    student: StudentTokenPayload;
  }
}
