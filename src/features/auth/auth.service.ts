import { sign, verify } from 'hono/jwt';
import { env } from '@/config/env';
import type { LoginResult, StudentTokenPayload } from '@/features/auth/auth.types';
import { AuthError, NotFoundError } from '@/shared/lib/errors';

const ACCESS_TOKEN_TTL_SEC = 900; // 15 minutes
const REFRESH_TOKEN_TTL_SEC = 604_800; // 7 days

type TokenBase = Omit<StudentTokenPayload, 'type' | 'iat' | 'exp'>;

export async function signAccessToken(payload: TokenBase): Promise<string> {
  return sign(
    { ...payload, type: 'access', exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SEC },
    env.JWT_SECRET,
    'HS256',
  );
}

export async function signRefreshToken(payload: TokenBase): Promise<string> {
  return sign(
    { ...payload, type: 'refresh', exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_TTL_SEC },
    env.JWT_SECRET,
    'HS256',
  );
}

export async function verifyStudentToken(token: string): Promise<StudentTokenPayload> {
  try {
    const payload = await verify(token, env.JWT_SECRET, 'HS256');
    return payload as unknown as StudentTokenPayload;
  } catch {
    throw new AuthError('Invalid or expired token', 'AUTH_INVALID_TOKEN');
  }
}

// Sprint 1 STUB — student table doesn't exist until Sprint 2.
// This intentionally throws NOT_IMPLEMENTED so the route exists but is not usable yet.
export async function loginStudent(_studentId: string, _pin: string): Promise<LoginResult> {
  throw new NotFoundError('Student login is not yet available', 'NOT_IMPLEMENTED');
}

export async function refreshStudentToken(refreshToken: string): Promise<LoginResult> {
  const payload = await verifyStudentToken(refreshToken);

  if (payload.type !== 'refresh') {
    throw new AuthError('Token is not a refresh token', 'AUTH_INVALID_TOKEN');
  }

  const base: TokenBase = {
    sub: payload.sub,
    firstName: payload.firstName,
    lastName: payload.lastName,
    ...(payload.hubId !== undefined && { hubId: payload.hubId }),
  };

  const [accessToken, newRefreshToken] = await Promise.all([
    signAccessToken(base),
    signRefreshToken(base),
  ]);

  return { accessToken, refreshToken: newRefreshToken, expiresIn: ACCESS_TOKEN_TTL_SEC };
}
