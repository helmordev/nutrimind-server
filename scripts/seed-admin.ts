/**
 * Seed script — creates the initial admin user.
 *
 * Usage:
 *   bun run scripts/seed-admin.ts
 *
 * Reads ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_FIRST_NAME / ADMIN_LAST_NAME
 * from .env.local (or process.env). Falls back to safe defaults for local dev.
 *
 * Safe to re-run — skips creation if admin already exists.
 */

import { eq } from 'drizzle-orm';
import { auth } from '@/config/auth';
import { db } from '@/config/database';
import { user } from '@/features/auth/auth.table';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@nutrimind.edu';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin@123456';
const ADMIN_FIRST_NAME = process.env.ADMIN_FIRST_NAME ?? 'Super';
const ADMIN_LAST_NAME = process.env.ADMIN_LAST_NAME ?? 'Admin';

async function seedAdmin(): Promise<void> {
  console.log('🌱  Seeding admin user…');

  // Check if an admin already exists
  const existing = await db.query.user.findFirst({
    where: eq(user.role, 'admin'),
  });

  if (existing) {
    console.log(`✅  Admin already exists: ${existing.email} — skipping.`);
    process.exit(0);
  }

  // Create via Better Auth admin plugin so password is hashed and the
  // account record is created properly alongside the user row.
  const result = await auth.api.createUser({
    body: {
      email: ADMIN_EMAIL,
      name: `${ADMIN_FIRST_NAME} ${ADMIN_LAST_NAME}`,
      password: ADMIN_PASSWORD,
      role: 'admin',
      data: {
        firstName: ADMIN_FIRST_NAME,
        lastName: ADMIN_LAST_NAME,
      },
    },
  });

  console.log(`✅  Admin created:`);
  console.log(`    ID    : ${result.user.id}`);
  console.log(`    Email : ${result.user.email}`);
  console.log(`    Name  : ${result.user.name}`);
  console.log(`    Role  : ${(result.user as { role?: string }).role ?? 'admin'}`);
  console.log('');
  console.log('⚠️   Change the default password before deploying to production!');
}

seedAdmin().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
