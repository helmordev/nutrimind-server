// Barrel file — re-export all feature table definitions here for Drizzle to infer relations.

// Relations must be exported here so Drizzle's query builder can resolve `with: {}` includes.
export * from '@/db/relations';
export * from '@/features/auth/auth.table';
export * from '@/features/hub/hub.table';
export * from '@/features/student/student.table';
