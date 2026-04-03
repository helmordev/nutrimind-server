import { count, eq } from 'drizzle-orm';
import { auth } from '@/config/auth';
import { db } from '@/config/database';
import type {
  CreateTeacherInput,
  PaginationQuery,
  UpdateTeacherInput,
} from '@/features/admin/admin.schema';
import type { AdminTeacherView } from '@/features/admin/admin.types';
import { user } from '@/features/auth/auth.table';
import { NotFoundError } from '@/shared/lib/errors';

function toAdminTeacherView(row: typeof user.$inferSelect): AdminTeacherView {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    name: row.name,
    school: row.school,
    role: row.role,
    banned: row.banned,
    banReason: row.banReason,
    emailVerified: row.emailVerified,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listTeachers(
  pagination: PaginationQuery,
): Promise<{ teachers: AdminTeacherView[]; total: number }> {
  const offset = (pagination.page - 1) * pagination.limit;

  const [rows, [totals]] = await Promise.all([
    db.select().from(user).where(eq(user.role, 'teacher')).limit(pagination.limit).offset(offset),
    db.select({ total: count() }).from(user).where(eq(user.role, 'teacher')),
  ]);

  return { teachers: rows.map(toAdminTeacherView), total: totals?.total ?? 0 };
}

export async function getTeacherById(id: string): Promise<AdminTeacherView> {
  const row = await db.query.user.findFirst({ where: eq(user.id, id) });
  if (!row) throw new NotFoundError('Teacher not found', 'TEACHER_NOT_FOUND');
  return toAdminTeacherView(row);
}

export async function createTeacher(
  data: CreateTeacherInput,
  requestHeaders: Headers,
): Promise<AdminTeacherView> {
  const result = await auth.api.createUser({
    body: {
      email: data.email,
      name: `${data.firstName} ${data.lastName}`,
      password: data.password,
      role: 'admin', // Better Auth only accepts "user" | "admin"; "teacher" set via direct DB update below
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        school: data.school,
      },
    },
    headers: requestHeaders,
  });

  const [updated] = await db
    .update(user)
    .set({ role: 'teacher', updatedAt: new Date() })
    .where(eq(user.id, result.user.id))
    .returning()
    .catch(async (err) => {
      // Safety fallback: ban the dangling admin account to prevent privilege escalation
      await db
        .update(user)
        .set({ banned: true, banReason: 'Creation failed — role not set', updatedAt: new Date() })
        .where(eq(user.id, result.user.id));
      throw err;
    });

  if (!updated) {
    throw new NotFoundError('Failed to finalize teacher creation', 'TEACHER_CREATE_FAILED');
  }

  return toAdminTeacherView(updated);
}

export async function updateTeacher(
  id: string,
  data: UpdateTeacherInput,
): Promise<AdminTeacherView> {
  const current = await db.query.user.findFirst({ where: eq(user.id, id) });
  if (!current) throw new NotFoundError('Teacher not found', 'TEACHER_NOT_FOUND');

  const updates: Partial<typeof user.$inferInsert> = { updatedAt: new Date() };

  if (data.firstName !== undefined) updates.firstName = data.firstName;
  if (data.lastName !== undefined) updates.lastName = data.lastName;
  if (data.school !== undefined) updates.school = data.school ?? null;
  if (data.email !== undefined) updates.email = data.email;

  if (data.firstName !== undefined || data.lastName !== undefined) {
    const newFirst = updates.firstName ?? current.firstName;
    const newLast = updates.lastName ?? current.lastName;
    updates.name = `${newFirst} ${newLast}`;
  }

  const [updated] = await db.update(user).set(updates).where(eq(user.id, id)).returning();
  if (!updated) throw new NotFoundError('Teacher not found', 'TEACHER_NOT_FOUND');
  return toAdminTeacherView(updated);
}

export async function deactivateTeacher(id: string): Promise<void> {
  const [updated] = await db
    .update(user)
    .set({ banned: true, banReason: 'Deactivated by admin', updatedAt: new Date() })
    .where(eq(user.id, id))
    .returning({ id: user.id });

  if (!updated) throw new NotFoundError('Teacher not found', 'TEACHER_NOT_FOUND');
}

export async function changeTeacherRole(
  id: string,
  role: 'admin' | 'teacher',
): Promise<AdminTeacherView> {
  const [updated] = await db
    .update(user)
    .set({ role, updatedAt: new Date() })
    .where(eq(user.id, id))
    .returning();

  if (!updated) throw new NotFoundError('Teacher not found', 'TEACHER_NOT_FOUND');
  return toAdminTeacherView(updated);
}
