import type { auth } from '@/config/auth';

export interface StudentTokenPayload {
  /** Student DB UUID — used as the JWT subject (stable, unique identifier) */
  sub: string;
  /** School-assigned student ID, e.g. "2024-0001" */
  studentId: string;
  firstName: string;
  lastName: string;
  hubId?: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
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
