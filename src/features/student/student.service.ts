import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/config/database';
import { redis } from '@/config/redis';
import { students } from '@/db/schema';
import type {
  BatchCreateResult,
  BatchCreateStudentInput,
  CreateStudentInput,
  ResetPinInput,
  StudentProfile,
  UpdateStudentInput,
} from '@/features/student/student.types';
import { NotFoundError, ValidationError } from '@/shared/lib/errors';

const BCRYPT_COST = 10;

/** Maps a DB row to a public-safe StudentProfile (never exposes pinHash or internal fields). */
function toProfile(row: typeof students.$inferSelect): StudentProfile {
  return {
    id: row.id,
    studentId: row.studentId,
    firstName: row.firstName,
    lastName: row.lastName,
    hubId: row.hubId,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Returns true if the error is a PostgreSQL unique-constraint violation (code 23505). */
function isDuplicateKeyError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const pgErr = err as Error & { code?: string };
  return pgErr.code === '23505' || err.message.toLowerCase().includes('unique');
}

export async function createStudent(input: CreateStudentInput): Promise<StudentProfile> {
  const pinHash = await Bun.password.hash(input.pin, { algorithm: 'bcrypt', cost: BCRYPT_COST });

  try {
    const rows = await db
      .insert(students)
      .values({
        studentId: input.studentId,
        firstName: input.firstName,
        lastName: input.lastName,
        pinHash,
      })
      .returning();

    // INSERT ... RETURNING always returns exactly one row for a single-value insert
    return toProfile(rows[0]!);
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new ValidationError('Student ID already exists', { studentId: input.studentId });
    }
    throw err;
  }
}

export async function batchCreateStudents(
  input: BatchCreateStudentInput,
): Promise<BatchCreateResult> {
  const created: StudentProfile[] = [];
  const failed: Array<{ studentId: string; reason: string }> = [];

  // Hash all PINs in parallel — bcrypt is CPU-bound so this improves throughput
  const hashed = await Promise.all(
    input.students.map(async (s) => ({
      ...s,
      pinHash: await Bun.password.hash(s.pin, { algorithm: 'bcrypt', cost: BCRYPT_COST }),
    })),
  );

  // Insert sequentially to get individual error isolation per student
  for (const studentInput of hashed) {
    try {
      const rows = await db
        .insert(students)
        .values({
          studentId: studentInput.studentId,
          firstName: studentInput.firstName,
          lastName: studentInput.lastName,
          pinHash: studentInput.pinHash,
        })
        .returning();

      created.push(toProfile(rows[0]!));
    } catch (err) {
      failed.push({
        studentId: studentInput.studentId,
        reason: isDuplicateKeyError(err) ? 'Student ID already exists' : 'Failed to create student',
      });
    }
  }

  return { created, failed };
}

export async function getStudentById(id: string): Promise<StudentProfile> {
  const student = await db.query.students.findFirst({
    where: and(eq(students.id, id), isNull(students.deletedAt)),
  });

  if (!student) {
    throw new NotFoundError('Student not found', 'STUDENT_NOT_FOUND');
  }

  return toProfile(student);
}

export async function listStudentsByHub(hubId: string): Promise<StudentProfile[]> {
  const rows = await db.query.students.findMany({
    where: and(eq(students.hubId, hubId), isNull(students.deletedAt)),
  });

  return rows.map(toProfile);
}

export async function updateStudent(
  id: string,
  input: UpdateStudentInput,
): Promise<StudentProfile> {
  const [updated] = await db
    .update(students)
    .set({
      ...(input.firstName !== undefined && { firstName: input.firstName }),
      ...(input.lastName !== undefined && { lastName: input.lastName }),
      updatedAt: new Date(),
    })
    .where(and(eq(students.id, id), isNull(students.deletedAt)))
    .returning();

  if (!updated) {
    throw new NotFoundError('Student not found', 'STUDENT_NOT_FOUND');
  }

  return toProfile(updated);
}

export async function resetStudentPin(id: string, input: ResetPinInput): Promise<void> {
  const pinHash = await Bun.password.hash(input.newPin, {
    algorithm: 'bcrypt',
    cost: BCRYPT_COST,
  });

  const [updated] = await db
    .update(students)
    .set({ pinHash, failedPinAttempts: 0, updatedAt: new Date() })
    .where(and(eq(students.id, id), isNull(students.deletedAt)))
    .returning({ id: students.id, studentId: students.studentId });

  if (!updated) {
    throw new NotFoundError('Student not found', 'STUDENT_NOT_FOUND');
  }

  // Clear any active lockout so the student can log in immediately with the new PIN
  await redis.del(`lockout:student:${updated.studentId}`);
}

export async function softDeleteStudent(id: string): Promise<void> {
  const [deleted] = await db
    .update(students)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(students.id, id), isNull(students.deletedAt)))
    .returning({ id: students.id });

  if (!deleted) {
    throw new NotFoundError('Student not found', 'STUDENT_NOT_FOUND');
  }
}
