# NutriMind Server — Agent Guidelines

## Project Summary

NutriMind EDU is a gamified adaptive learning backend for Grade 5–6 students.
Built with **Bun + Hono + Drizzle + PostgreSQL (Aiven) + Redis (Upstash) + MongoDB Atlas**.
Dual-client: Unity game (students) + React TS admin panel (teachers/admin).
Dual-auth: Better Auth for teachers/admin (cookie sessions) + Custom JWT for students (PIN-based).

---

## Build, Lint & Test Commands

```bash
# Dev server (hot reload)
bun run dev                        # bun run --hot src/index.ts

# Linting & formatting (Biome — replaces ESLint + Prettier)
bun run check                      # biome check --write .
bun run lint                       # biome lint .
bun run format                     # biome format --write .

# Run ALL tests
bun test

# Run a SINGLE test file
bun test src/features/auth/auth.test.ts

# Run tests matching a name pattern
bun test --test-name-pattern "student login"

# Run tests with watch mode
bun test --watch

# Database migrations (Drizzle)
bunx drizzle-kit generate          # generate SQL migration from schema changes
bunx drizzle-kit migrate           # apply migrations to Aiven PostgreSQL

# Database seeding
bun run scripts/seed.ts            # seed worlds, zones, topics, badges (NOT challenges)

# Type checking
bunx tsc --noEmit
```

> **All cloud services are remote** — no local PostgreSQL/Redis/MongoDB needed.
> Ensure `.env.local` has `DATABASE_URL`, `UPSTASH_REDIS_URL`, `MONGODB_URI`,
> `BETTER_AUTH_SECRET`, `JWT_SECRET`, `CORS_ORIGINS` before running.

---

## Project Structure

Feature-based modular organization. Each feature is **self-contained**:

```
src/
├── index.ts                  # Entry point — Bun.serve + BullMQ workers
├── app.ts                    # Hono app — mounts all feature routes + middleware
├── config/                   # env.ts, auth.ts, database.ts, redis.ts, mongodb.ts
├── db/
│   ├── schema.ts             # Barrel — re-exports all *.table.ts files (REQUIRED for Drizzle)
│   ├── migrations/           # Generated SQL (drizzle-kit output)
│   └── seed/                 # worlds.seed.ts, challenges.seed.ts, badges.seed.ts
├── features/                 # One folder per domain
│   └── {feature}/
│       ├── {feature}.table.ts     # Drizzle table definitions (if feature owns tables)
│       ├── {feature}.routes.ts    # Hono route handlers
│       ├── {feature}.service.ts   # Business logic (pure functions preferred)
│       ├── {feature}.schema.ts    # Zod validation schemas
│       ├── {feature}.types.ts     # TypeScript types/interfaces
│       ├── {feature}.test.ts      # Unit + integration tests (colocated)
│       ├── {feature}.ws.ts        # WebSocket handlers (only if needed)
│       └── {feature}.job.ts       # BullMQ job definitions (only if needed)
└── shared/
    ├── middleware/           # student-auth.ts, role.ts, rate-limit.ts, error-handler.ts, logger.ts
    ├── lib/                  # errors.ts, response.ts, pagination.ts, server-code.ts, anti-cheat.ts
    ├── services/             # adaptive-learning.ts, ws-manager.ts
    └── types/                # env.d.ts, game.types.ts, api.types.ts
```

> **schema.ts barrel is mandatory** — all `*.table.ts` files must be re-exported there
> for Drizzle to infer cross-feature relations.

---

## TypeScript Configuration

- **Strict mode** enabled (`strict: true`, `noUncheckedIndexedAccess: true`)
- **Path alias**: `@/*` maps to `./src/*` — always use this for internal imports
- **Target**: `ESNext`, `moduleResolution: "Bundler"` (Bun native)
- **No `any`** — use `unknown` and narrow explicitly

```ts
// ✅ Correct import style
import { db } from "@/config/database";
import { studentSchema } from "@/features/student/student.schema";

// ❌ Wrong
import { db } from "../../config/database";
```

---

## Code Style (Biome)

Biome enforces all formatting and linting. No ESLint, no Prettier.

- **Indentation**: 2 spaces
- **Quotes**: double quotes for strings
- **Semicolons**: always
- **Trailing commas**: always in multiline
- **Line length**: 100 characters max
- **Import order**: Biome auto-organizes — external packages first, then internal `@/` aliases

Run `bun run check` before committing. CI will reject unformatted code.

---

## Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Files | `kebab-case` with feature prefix | `student.service.ts` |
| Functions | `camelCase` | `createStudent`, `getHubById` |
| Types/Interfaces | `PascalCase` | `StudentProfile`, `HubMember` |
| Zod schemas | `camelCase` with `Schema` suffix | `createStudentSchema` |
| DB tables | `snake_case` (Drizzle convention) | `student_refresh_tokens` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_PIN_ATTEMPTS` |
| Route paths | `kebab-case`, pluralized nouns | `/api/v1/daily-challenges` |
| Error codes | `SCREAMING_SNAKE_CASE` string | `AUTH_INVALID_PIN` |

---

## Error Handling

Use custom error classes from `src/shared/lib/errors.ts`. **Never throw raw `Error`**.

```ts
// Custom error classes:
// AppError(message, statusCode, code)
// NotFoundError(message, code?)
// ValidationError(message, details?)
// AuthError(message, code?)

// ✅ In services — throw typed errors
throw new NotFoundError("Student not found", "STUDENT_NOT_FOUND");
throw new AuthError("Invalid PIN", "AUTH_INVALID_PIN");

// ✅ In routes — let the global error handler catch it
// error-handler.ts maps error classes → HTTP responses automatically
```

All API responses follow this envelope:

```ts
// Success
{ success: true, data: T, meta?: { pagination... } }

// Error
{ success: false, error: { code: string, message: string, details?: object } }
```

Use helpers from `src/shared/lib/response.ts` — never hand-craft JSON responses.

---

## Validation Pattern (Zod)

Every route input is validated with `@hono/zod-validator`. Define schemas in `{feature}.schema.ts`.

```ts
// schema file
export const createStudentSchema = z.object({
  studentId: z.string().min(6).max(20),
  firstName: z.string().min(1).max(100),
  pin: z.string().length(6).regex(/^\d+$/, "PIN must be 6 digits"),
});

// route file
app.post("/", zValidator("json", createStudentSchema), async (c) => {
  const body = c.req.valid("json"); // fully typed
  // ...
});
```

> Validate `json`, `query`, `param` separately. Never trust raw `c.req.json()`.

---

## Database (Drizzle + PostgreSQL)

- All table definitions live in `{feature}.table.ts` and are re-exported from `src/db/schema.ts`
- Use **parameterized queries** only — Drizzle handles this by default
- Foreign keys: `varchar(36)` for Better Auth user IDs, `uuid` for custom entities
- Soft deletes preferred (`deleted_at timestamp`) over hard deletes for audit trails
- All timestamps: `timestamp("created_at").defaultNow().notNull()`

```ts
// ✅ Drizzle query style
const student = await db.query.students.findFirst({
  where: eq(students.studentId, id),
  with: { hubMembers: true },
});
```

---

## Authentication Rules

- **Teachers/Admin**: Better Auth session cookie (`better-auth.session_token`)
  — protected via `betterAuthMiddleware` in shared middleware
- **Students**: Bearer JWT in `Authorization` header
  — protected via `studentAuthMiddleware` in shared middleware
- **Role guard**: Always apply `requireRole('admin')` / `requireRole('teacher')` after auth middleware
- **Student PIN**: hashed with `Bun.password` (bcrypt, cost ≥ 10)
- **Rate limiting**: Apply `rateLimit` middleware to all auth endpoints; student login max 5/min

---

## Testing Conventions

Tests use **bun:test** (built-in). Colocate tests in `{feature}.test.ts`.

```ts
import { describe, it, expect, beforeAll } from "bun:test";

describe("auth", () => {
  describe("student login", () => {
    it("returns JWT on valid credentials", async () => {
      // Arrange
      // Act
      // Assert
      expect(response.status).toBe(200);
    });

    it("rejects invalid PIN", async () => { ... });
  });
});
```

- Use **Hono's `app.request()`** for integration tests — no real server needed
- **Mock** external services (Redis, MongoDB, email) with `mock()` from `bun:test`
- Cover: happy path, error path, edge cases, auth guard verification
- Test files must not require live cloud connections — use test doubles

---

## API Conventions

- All routes prefixed with `/api/v1/`
- WebSocket upgrades handled per-feature in `{feature}.ws.ts`
- SSE (teacher dashboard) uses Hono's `streamSSE` — never raw WebSocket for one-way streams
- Pagination: cursor-based for large sets, offset for small sets — use `src/shared/lib/pagination.ts`
- Analytics writes: **fire-and-forget** — wrap in `try/catch`, never block the main flow

---

## Environment Variables (Required)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Aiven PostgreSQL with `?sslmode=require` |
| `UPSTASH_REDIS_URL` | Upstash Redis (`rediss://`) |
| `MONGODB_URI` | MongoDB Atlas (`mongodb+srv://`) |
| `BETTER_AUTH_SECRET` | 32+ char random secret |
| `BETTER_AUTH_URL` | Base URL (e.g. `http://localhost:3000`) |
| `JWT_SECRET` | 64 char random secret (student auth) |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `PORT` | Server port (default `3000`) |

Copy `.env.example` → `.env.local` and fill in values before running.
