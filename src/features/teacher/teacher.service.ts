import { eq } from 'drizzle-orm';
import { db } from '@/config/database';
import { user } from '@/features/auth/auth.table';
import type { UpdateTeacherProfileInput } from '@/features/teacher/teacher.schema';
import type { TeacherProfile } from '@/features/teacher/teacher.types';
import { NotFoundError } from '@/shared/lib/errors';

function toTeacherProfile(row: typeof user.$inferSelect): TeacherProfile {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    name: row.name,
    school: row.school,
    emailVerified: row.emailVerified,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getTeacherProfile(userId: string): Promise<TeacherProfile> {
  const row = await db.query.user.findFirst({ where: eq(user.id, userId) });
  if (!row) throw new NotFoundError('Teacher not found', 'TEACHER_NOT_FOUND');
  return toTeacherProfile(row);
}

export async function updateTeacherProfile(
  userId: string,
  data: UpdateTeacherProfileInput,
): Promise<TeacherProfile> {
  const current = await db.query.user.findFirst({ where: eq(user.id, userId) });
  if (!current) throw new NotFoundError('Teacher not found', 'TEACHER_NOT_FOUND');

  const updates: Partial<typeof user.$inferInsert> = { updatedAt: new Date() };

  if (data.firstName !== undefined) updates.firstName = data.firstName;
  if (data.lastName !== undefined) updates.lastName = data.lastName;
  if (data.school !== undefined) updates.school = data.school ?? null;

  // Keep display name in sync
  const newFirst = updates.firstName ?? current.firstName;
  const newLast = updates.lastName ?? current.lastName;
  updates.name = `${newFirst} ${newLast}`;

  const [updated] = await db.update(user).set(updates).where(eq(user.id, userId)).returning();
  if (!updated) throw new NotFoundError('Teacher not found', 'TEACHER_NOT_FOUND');
  return toTeacherProfile(updated);
}
