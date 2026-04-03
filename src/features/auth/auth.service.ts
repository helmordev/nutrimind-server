import { createHash } from 'node:crypto';
import { and, eq, gt, isNull, lt } from 'drizzle-orm';
import { sign, verify } from 'hono/jwt';
import { db } from '@/config/database';
import { env } from '@/config/env';
import { redis } from '@/config/redis';
import { studentRefreshTokens, students } from '@/db/schema';
import type { LoginResult, StudentTokenPayload } from '@/features/auth/auth.types';
import { AuthError } from '@/shared/lib/errors';

const ACCESS_TOKEN_TTL_SEC = 900;
const REFRESH_TOKEN_TTL_SEC = 604_800;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_TTL_SEC = 900;

type TokenBase = Omit<StudentTokenPayload, 'type' | 'iat' | 'exp'>;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

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

export async function loginStudent(studentId: string, pin: string): Promise<LoginResult> {
  const lockoutKey = `lockout:student:${studentId}`;
  const isLocked = await redis.get(lockoutKey);

  if (isLocked) {
    throw new AuthError(
      'Account temporarily locked due to too many failed attempts. Try again in 15 minutes.',
      'AUTH_ACCOUNT_LOCKED',
    );
  }

  const student = await db.query.students.findFirst({
    where: and(eq(students.studentId, studentId), isNull(students.deletedAt)),
  });

  // Intentionally generic error — don't reveal whether the ID exists
  if (!student) {
    throw new AuthError('Invalid credentials', 'AUTH_INVALID_CREDENTIALS');
  }

  const isPinValid = await Bun.password.verify(pin, student.pinHash);

  if (!isPinValid) {
    const newAttempts = student.failedPinAttempts + 1;

    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      await Promise.all([
        db
          .update(students)
          .set({ failedPinAttempts: 0, updatedAt: new Date() })
          .where(eq(students.id, student.id)),
        redis.set(lockoutKey, '1', 'EX', LOCKOUT_TTL_SEC),
      ]);
    } else {
      await db
        .update(students)
        .set({ failedPinAttempts: newAttempts, updatedAt: new Date() })
        .where(eq(students.id, student.id));
    }

    throw new AuthError('Invalid credentials', 'AUTH_INVALID_CREDENTIALS');
  }

  await db
    .update(students)
    .set({ failedPinAttempts: 0, lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(students.id, student.id));

  // sub = DB UUID, studentId = school-assigned ID
  const base: TokenBase = {
    sub: student.id,
    studentId: student.studentId,
    firstName: student.firstName,
    lastName: student.lastName,
    ...(student.hubId !== null && { hubId: student.hubId }),
  };

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(base),
    signRefreshToken(base),
  ]);

  await db.insert(studentRefreshTokens).values({
    studentId: student.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SEC * 1000),
  });

  return { accessToken, refreshToken, expiresIn: ACCESS_TOKEN_TTL_SEC };
}

export async function refreshStudentToken(refreshToken: string): Promise<LoginResult> {
  const payload = await verifyStudentToken(refreshToken);

  if (payload.type !== 'refresh') {
    throw new AuthError('Token is not a refresh token', 'AUTH_INVALID_TOKEN');
  }

  const student = await db.query.students.findFirst({
    where: and(eq(students.id, payload.sub), isNull(students.deletedAt)),
  });

  if (!student) {
    throw new AuthError('Student not found', 'AUTH_INVALID_TOKEN');
  }

  // 3. Validate against stored token hash (prevents replay after logout)
  const tokenHash = hashToken(refreshToken);
  const storedToken = await db.query.studentRefreshTokens.findFirst({
    where: and(
      eq(studentRefreshTokens.studentId, student.id),
      eq(studentRefreshTokens.tokenHash, tokenHash),
      gt(studentRefreshTokens.expiresAt, new Date()),
    ),
  });

  if (!storedToken) {
    throw new AuthError('Refresh token not found or already used', 'AUTH_INVALID_TOKEN');
  }

  await db.delete(studentRefreshTokens).where(eq(studentRefreshTokens.id, storedToken.id));

  const base: TokenBase = {
    sub: payload.sub,
    studentId: payload.studentId,
    firstName: payload.firstName,
    lastName: payload.lastName,
    ...(payload.hubId !== undefined && { hubId: payload.hubId }),
  };

  const [accessToken, newRefreshToken] = await Promise.all([
    signAccessToken(base),
    signRefreshToken(base),
  ]);

  await db.insert(studentRefreshTokens).values({
    studentId: student.id,
    tokenHash: hashToken(newRefreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SEC * 1000),
  });

  return { accessToken, refreshToken: newRefreshToken, expiresIn: ACCESS_TOKEN_TTL_SEC };
}

/**
 * Invalidates a student session by:
 * 1. Blocklisting the access token in Redis for the remainder of its TTL.
 * 2. Deleting all refresh tokens for the student (full logout from all devices).
 */
export async function logoutStudent(
  accessToken: string,
  payload: StudentTokenPayload,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const ttl = (payload.exp ?? now) - now;

  await Promise.all([
    // Only blocklist if the token hasn't already expired
    ttl > 0
      ? redis.set(`blocklist:access:${hashToken(accessToken)}`, '1', 'EX', ttl)
      : Promise.resolve(),
    db.delete(studentRefreshTokens).where(eq(studentRefreshTokens.studentId, payload.sub)),
  ]);
}

/**
 * Deletes all expired refresh tokens from the DB.
 * Intended to be called periodically (e.g. via a BullMQ scheduled job).
 */
export async function purgeExpiredRefreshTokens(): Promise<number> {
  const result = await db
    .delete(studentRefreshTokens)
    .where(lt(studentRefreshTokens.expiresAt, new Date()))
    .returning({ id: studentRefreshTokens.id });

  return result.length;
}
