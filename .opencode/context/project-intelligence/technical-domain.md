<!-- Context: project-intelligence/technical | Priority: critical | Version: 1.1 | Updated: 2026-04-04 -->

# Technical Domain — NutriMind Server

> Stack, architecture, and key technical patterns for the NutriMind EDU backend.

## Primary Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Runtime | **Bun** | Native TypeScript, fast test runner, built-in `Bun.password` |
| Framework | **Hono** | Lightweight, edge-ready, native WS + SSE support |
| ORM | **Drizzle** | Type-safe SQL, zero-overhead, Bun-compatible |
| Primary DB | **PostgreSQL (Aiven)** | Relational integrity for students, hubs, progress |
| Analytics DB | **MongoDB Atlas** | Flexible schema for gameplay events + adaptive data |
| Cache / RT | **Redis (Upstash)** | Rate limiting, active challenge locks, session state |
| Auth (teacher/admin) | **Better Auth** | Cookie sessions, admin plugin, Drizzle adapter |
| Auth (student) | **Custom JWT** | PIN-based, Bearer token, Unity-compatible |
| Jobs | **BullMQ** | Badge awards, XP calculations, async tasks |
| Validation | **Zod** | All route inputs validated via `@hono/zod-validator` |
| Linter/Formatter | **Biome** | Replaces ESLint + Prettier; run `bun run check` |

## Architecture

```
Type:    Feature-based Modular Monolith
Clients: Unity (students, C#) + React TS (teachers/admin)
Comms:   REST /api/v1/* | WebSocket (Hono native) | SSE (streamSSE)
Auth:    Dual — Better Auth cookie (admin/teacher) + JWT Bearer (student)
```

## Project Structure

```
src/
├── index.ts              # Entry — Bun.serve + BullMQ workers
├── app.ts                # Hono app — routes + middleware
├── config/               # env.ts, auth.ts, database.ts, redis.ts, mongodb.ts
├── db/
│   ├── schema.ts         # ⚠️ BARREL — must re-export ALL *.table.ts files
│   ├── migrations/       # drizzle-kit output (never edit manually)
│   └── seed/             # worlds, challenges, badges seed scripts
├── features/             # One folder per domain (self-contained)
│   └── {feature}/
│       ├── {feature}.table.ts    # Drizzle table definitions
│       ├── {feature}.routes.ts   # Hono route handlers
│       ├── {feature}.service.ts  # Business logic (pure functions)
│       ├── {feature}.schema.ts   # Zod validation schemas
│       ├── {feature}.types.ts    # TypeScript interfaces
│       ├── {feature}.test.ts     # Colocated tests (bun:test)
│       ├── {feature}.ws.ts       # WebSocket handlers (if needed)
│       └── {feature}.job.ts      # BullMQ jobs (if needed)
└── shared/
    ├── middleware/         # student-auth.ts, role.ts, rate-limit.ts, error-handler.ts
    ├── lib/                # errors.ts, response.ts, pagination.ts, anti-cheat.ts
    ├── services/           # adaptive-learning.ts, ws-manager.ts
    └── types/              # env.d.ts, game.types.ts, api.types.ts
```

## Integration Points

| System | Purpose | Protocol | Direction |
|--------|---------|----------|-----------|
| PostgreSQL (Aiven) | Students, hubs, progress, challenges | Drizzle ORM | Internal |
| MongoDB Atlas | Gameplay events, adaptive analytics | Mongoose/native | Outbound write |
| Redis (Upstash) | Rate limits, active challenge locks, session state | ioredis | Internal |
| Unity Client | Student gameplay (questions, XP, boss) | REST + WS | Inbound |
| React Admin Panel | Teacher/admin management + SSE dashboard | REST + SSE | Inbound |
| BullMQ | Badge awards, XP jobs, async tasks | Redis-backed | Internal |

## Response Envelope (always use `shared/lib/response.ts`)

```ts
// Success
{ success: true, data: T, meta?: { pagination... } }

// Error
{ success: false, error: { code: string, message: string, details?: object } }
```

## Security Patterns

- Zod validates ALL inputs before any business logic runs
- Server-side answer validation — never trust Unity client
- Redis anti-cheat: active challenge lock per student
- Rate limiting: 5 req/min on student login, lockout after 10 failures
- Better Auth cookies: `httpOnly`, `secure`, `sameSite`
- Secure headers via `hono/secure-headers`
- Parameterized queries via Drizzle (SQL injection prevention)

## Dev Commands

```bash
bun run dev          # Hot reload dev server
bun test             # Run all tests
bun run check        # Biome lint + format (run before commit)
bunx drizzle-kit generate && bunx drizzle-kit migrate   # DB migrations
bun run scripts/seed.ts   # Seed worlds/zones/topics/badges
```

> All cloud services are **remote only** — no local PG/Redis/MongoDB needed.
> Requires `.env.local` with: `DATABASE_URL`, `UPSTASH_REDIS_URL`, `MONGODB_URI`,
> `BETTER_AUTH_SECRET`, `JWT_SECRET`, `CORS_ORIGINS`

## 📂 Codebase References

- `src/config/` — All service connections (db, redis, mongodb, auth)
- `src/db/schema.ts` — Drizzle barrel (critical: must include all tables)
- `src/shared/lib/errors.ts` — Custom error classes (never throw raw `Error`)
- `src/shared/lib/response.ts` — Standardized response helpers
- `src/shared/middleware/` — Auth, role guard, rate limiting
- `src/features/` — All domain features (self-contained modules)

## Related Files

- `business-domain.md` — Why this stack exists
- `business-tech-bridge.md` — Business need → technical solution mapping
- `decisions-log.md` — Full rationale for stack choices
