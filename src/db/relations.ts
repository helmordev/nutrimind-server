import { relations } from 'drizzle-orm';
import { user } from '@/features/auth/auth.table';
import { hubMembers, hubs, serverCodes } from '@/features/hub/hub.table';
import { studentRefreshTokens, students } from '@/features/student/student.table';

export const studentRelations = relations(students, ({ one, many }) => ({
  hub: one(hubs, { fields: [students.hubId], references: [hubs.id] }),
  refreshTokens: many(studentRefreshTokens),
  hubMemberships: many(hubMembers),
}));

export const studentRefreshTokenRelations = relations(studentRefreshTokens, ({ one }) => ({
  student: one(students, {
    fields: [studentRefreshTokens.studentId],
    references: [students.id],
  }),
}));

export const hubRelations = relations(hubs, ({ one, many }) => ({
  teacher: one(user, { fields: [hubs.teacherId], references: [user.id] }),
  members: many(hubMembers),
  serverCodes: many(serverCodes),
}));

export const hubMemberRelations = relations(hubMembers, ({ one }) => ({
  hub: one(hubs, { fields: [hubMembers.hubId], references: [hubs.id] }),
  student: one(students, { fields: [hubMembers.studentId], references: [students.id] }),
}));

export const serverCodeRelations = relations(serverCodes, ({ one }) => ({
  hub: one(hubs, { fields: [serverCodes.hubId], references: [hubs.id] }),
  createdByUser: one(user, { fields: [serverCodes.createdBy], references: [user.id] }),
}));
