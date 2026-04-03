import { and, count, eq, isNull } from 'drizzle-orm';
import { db } from '@/config/database';
import { hubMembers, hubs, serverCodes, students } from '@/db/schema';
import type {
  CreateHubInput,
  GenerateCodeInput,
  Hub,
  HubMember,
  HubWithMemberCount,
  JoinHubInput,
  ServerCode,
  UpdateHubInput,
} from '@/features/hub/hub.types';
import { ForbiddenError, NotFoundError, ValidationError } from '@/shared/lib/errors';
import {
  cacheServerCode,
  generateServerCode,
  getHubIdByCode,
  invalidateServerCode,
} from '@/shared/lib/server-code';

function toHub(row: typeof hubs.$inferSelect): Hub {
  return {
    id: row.id,
    name: row.name,
    teacherId: row.teacherId,
    deletedAt: row.deletedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toServerCode(row: typeof serverCodes.$inferSelect): ServerCode {
  return {
    id: row.id,
    hubId: row.hubId,
    code: row.code,
    createdBy: row.createdBy,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  };
}

function toHubMember(row: typeof hubMembers.$inferSelect): HubMember {
  return {
    id: row.id,
    hubId: row.hubId,
    studentId: row.studentId,
    joinedAt: row.joinedAt,
  };
}

export async function createHub(teacherId: string, input: CreateHubInput): Promise<Hub> {
  const rows = await db.insert(hubs).values({ name: input.name, teacherId }).returning();
  return toHub(rows[0]!);
}

export async function getHubById(id: string): Promise<HubWithMemberCount> {
  const hub = await db.query.hubs.findFirst({
    where: and(eq(hubs.id, id), isNull(hubs.deletedAt)),
  });

  if (!hub) {
    throw new NotFoundError('Hub not found', 'HUB_NOT_FOUND');
  }

  const countRows = await db
    .select({ value: count(hubMembers.id) })
    .from(hubMembers)
    .where(eq(hubMembers.hubId, id));

  const memberCount = countRows[0]?.value ?? 0;

  return { ...toHub(hub), memberCount };
}

export async function listHubsByTeacher(teacherId: string): Promise<HubWithMemberCount[]> {
  const rows = await db
    .select({
      id: hubs.id,
      name: hubs.name,
      teacherId: hubs.teacherId,
      deletedAt: hubs.deletedAt,
      createdAt: hubs.createdAt,
      updatedAt: hubs.updatedAt,
      memberCount: count(hubMembers.id),
    })
    .from(hubs)
    .leftJoin(hubMembers, eq(hubs.id, hubMembers.hubId))
    .where(and(eq(hubs.teacherId, teacherId), isNull(hubs.deletedAt)))
    .groupBy(hubs.id);

  return rows.map((row) => ({ ...row, memberCount: row.memberCount }));
}

export async function updateHub(
  id: string,
  teacherId: string,
  input: UpdateHubInput,
): Promise<Hub> {
  const [updated] = await db
    .update(hubs)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      updatedAt: new Date(),
    })
    .where(and(eq(hubs.id, id), eq(hubs.teacherId, teacherId), isNull(hubs.deletedAt)))
    .returning();

  if (!updated) {
    throw new NotFoundError('Hub not found or access denied', 'HUB_NOT_FOUND');
  }

  return toHub(updated);
}

export async function softDeleteHub(id: string, teacherId: string): Promise<void> {
  const [deleted] = await db
    .update(hubs)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(hubs.id, id), eq(hubs.teacherId, teacherId), isNull(hubs.deletedAt)))
    .returning({ id: hubs.id });

  if (!deleted) {
    throw new NotFoundError('Hub not found or access denied', 'HUB_NOT_FOUND');
  }
}

export async function generateCode(
  hubId: string,
  teacherId: string,
  input: GenerateCodeInput,
): Promise<ServerCode> {
  const hub = await db.query.hubs.findFirst({
    where: and(eq(hubs.id, hubId), eq(hubs.teacherId, teacherId), isNull(hubs.deletedAt)),
  });

  if (!hub) {
    throw new NotFoundError('Hub not found or access denied', 'HUB_NOT_FOUND');
  }

  const ttlSeconds = input.ttlSeconds ?? 86_400;
  const code = generateServerCode();
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  const codeRows = await db
    .insert(serverCodes)
    .values({ hubId, code, createdBy: teacherId, expiresAt })
    .returning();

  await cacheServerCode(code, hubId, ttlSeconds);

  return toServerCode(codeRows[0]!);
}

export async function revokeServerCode(
  hubId: string,
  codeId: string,
  teacherId: string,
): Promise<void> {
  const hub = await db.query.hubs.findFirst({
    where: and(eq(hubs.id, hubId), eq(hubs.teacherId, teacherId), isNull(hubs.deletedAt)),
  });

  if (!hub) {
    throw new NotFoundError('Hub not found or access denied', 'HUB_NOT_FOUND');
  }

  const code = await db.query.serverCodes.findFirst({
    where: and(eq(serverCodes.id, codeId), eq(serverCodes.hubId, hubId)),
  });

  if (!code) {
    throw new NotFoundError('Server code not found', 'CODE_NOT_FOUND');
  }

  await db.delete(serverCodes).where(eq(serverCodes.id, codeId));
  await invalidateServerCode(code.code);
}

export async function joinHub(studentUuid: string, input: JoinHubInput): Promise<HubMember> {
  const hubId = await getHubIdByCode(input.code);

  if (!hubId) {
    throw new ValidationError('Invalid or expired server code', {
      code: 'CODE_INVALID_OR_EXPIRED',
    });
  }

  const hub = await db.query.hubs.findFirst({
    where: and(eq(hubs.id, hubId), isNull(hubs.deletedAt)),
  });

  if (!hub) {
    throw new ValidationError('Hub no longer exists', { code: 'HUB_NOT_FOUND' });
  }

  const student = await db.query.students.findFirst({
    where: and(eq(students.id, studentUuid), isNull(students.deletedAt)),
  });

  if (!student) {
    throw new NotFoundError('Student not found', 'STUDENT_NOT_FOUND');
  }

  if (student.hubId !== null) {
    if (student.hubId === hubId) {
      throw new ValidationError('You are already a member of this hub', {
        code: 'HUB_ALREADY_MEMBER',
      });
    }
    throw new ValidationError('You must leave your current hub before joining another', {
      code: 'HUB_STUDENT_ALREADY_IN_HUB',
    });
  }

  // Insert membership + update student record atomically
  const memberRows = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(hubMembers)
      .values({ hubId, studentId: studentUuid })
      .returning();

    await tx
      .update(students)
      .set({ hubId, updatedAt: new Date() })
      .where(eq(students.id, studentUuid));

    return inserted;
  });

  return toHubMember(memberRows[0]!);
}

export async function listHubMembers(hubId: string): Promise<HubMember[]> {
  const rows = await db.query.hubMembers.findMany({
    where: eq(hubMembers.hubId, hubId),
  });

  return rows.map(toHubMember);
}

export async function removeHubMember(
  hubId: string,
  studentUuid: string,
  teacherId: string,
): Promise<void> {
  const hub = await db.query.hubs.findFirst({
    where: and(eq(hubs.id, hubId), eq(hubs.teacherId, teacherId), isNull(hubs.deletedAt)),
  });

  if (!hub) {
    throw new NotFoundError('Hub not found or access denied', 'HUB_NOT_FOUND');
  }

  const existing = await db.query.hubMembers.findFirst({
    where: and(eq(hubMembers.hubId, hubId), eq(hubMembers.studentId, studentUuid)),
  });

  if (!existing) {
    throw new NotFoundError('Student is not a member of this hub', 'HUB_MEMBER_NOT_FOUND');
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(hubMembers)
      .where(and(eq(hubMembers.hubId, hubId), eq(hubMembers.studentId, studentUuid)));

    await tx
      .update(students)
      .set({ hubId: null, updatedAt: new Date() })
      .where(eq(students.id, studentUuid));
  });
}

export async function getHubServerCodes(hubId: string, teacherId: string): Promise<ServerCode[]> {
  const hub = await db.query.hubs.findFirst({
    where: and(eq(hubs.id, hubId), eq(hubs.teacherId, teacherId), isNull(hubs.deletedAt)),
  });

  if (!hub) {
    throw new ForbiddenError('Access denied', 'HUB_ACCESS_DENIED');
  }

  const rows = await db.query.serverCodes.findMany({
    where: eq(serverCodes.hubId, hubId),
  });

  return rows.map(toServerCode);
}
