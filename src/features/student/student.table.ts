import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const students = pgTable('students', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** School-assigned student ID, e.g. "2024-0001" — NOT a UUID */
  studentId: text('student_id').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  pinHash: text('pin_hash').notNull(),
  /**
   * Current hub the student belongs to.
   * No inline .references() to avoid circular import with hub.table.ts.
   * Referential integrity enforced via hub_members and application logic.
   */
  hubId: uuid('hub_id'),
  failedPinAttempts: integer('failed_pin_attempts').notNull().default(0),
  lastLoginAt: timestamp('last_login_at'),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const studentRefreshTokens = pgTable('student_refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  /** Stored as a hash — raw token is never persisted. */
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
