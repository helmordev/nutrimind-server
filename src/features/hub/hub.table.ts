import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { user } from '@/features/auth/auth.table';
import { students } from '@/features/student/student.table';

export const hubs = pgTable('hubs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  /** varchar(36) to match Better Auth user ID type */
  teacherId: varchar('teacher_id', { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: 'restrict' }),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const serverCodes = pgTable('server_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  hubId: uuid('hub_id')
    .notNull()
    .references(() => hubs.id, { onDelete: 'cascade' }),
  code: text('code').notNull().unique(),
  createdBy: varchar('created_by', { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: 'restrict' }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const hubMembers = pgTable('hub_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  hubId: uuid('hub_id')
    .notNull()
    .references(() => hubs.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});
