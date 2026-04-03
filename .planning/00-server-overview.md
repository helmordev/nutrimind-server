# NutriMind Server — Overview & Architecture

**Generated**: 2026-04-03
**Project**: NutriMind EDU Game Server (Backend)
**Complexity**: High

---

## 1. Project Summary

NutriMind EDU is a gamified, adaptive learning system for Grade 5-6 students at Tayug Central Elementary School. It covers three MATATAG-aligned subject hubs — English, Science, and PE+Health — in a single interactive platform.

**This plan covers the game server** that powers:
- Teacher dashboard and student management
- Game world mechanics and challenge delivery
- Real-time multiplayer and live events
- Adaptive learning engine
- Offline content packs (practice mode only — no server sync)
- Progress tracking and DepEd-aligned grading

### Users & Clients

| Role | Client | Auth Method | Capabilities |
|------|--------|------------|--------------|
| **Admin** | React TS (Web) | Better Auth (email + password) | Create teacher accounts, manage curriculum content, school-wide analytics, all hub oversight |
| **Teacher** | React TS (Web) | Better Auth (email + password) | Create student accounts, create hubs (max 3: one per subject), **create and manage challenge content per hub**, manage students, view grades, export reports |
| **Student** | Unity (C# Game) | Custom JWT (student ID + PIN) | Play worlds, complete challenges, earn badges, view progress |

> **Account creation flow:** Admin creates teacher accounts (no teacher self-registration). Teachers create student accounts (not admin). Each teacher can create up to 3 hubs — one per subject (`english`, `science`, `pe_health`).

> **Dual-client architecture:** The student game is a **Unity** application (C#); the teacher/admin panel is a **React TypeScript** web app. Both communicate with this server via REST + WebSocket/SSE.

---

## 2. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Runtime | **Bun.js** | Native TS, fast startup (~25ms), built-in test runner |
| Framework | **Hono** | Lightweight, middleware ecosystem, native WebSocket + SSE |
| ORM | **Drizzle** | Type-safe, zero runtime overhead, SQL-like syntax |
| Primary DB | **PostgreSQL (Aiven)** | Relational data: users, progress, grades, content |
| Analytics DB | **MongoDB Atlas** | Game event logs, player telemetry, session analytics |
| Cache/RT | **Redis (Upstash)** | Sessions, caching, leaderboards, pub/sub, job queue |
| Validation | **Zod** | Runtime schema validation with TypeScript inference |
| Auth (Teacher/Admin) | **Better Auth** | Full-featured auth: sessions, roles, admin plugin, Drizzle adapter |
| Auth (Student) | **Custom JWT** | Student ID + PIN → access + refresh token pair |
| Hashing | **Bun.password** | Native bcrypt for student PIN hashing |
| Jobs | **BullMQ** | Background tasks on existing Redis |
| Logging | **pino** | Structured JSON logging |
| Linter/Formatter | **Biome** | All-in-one linter + formatter (Rust-based, fast) |

### Package Dependencies

**Core:**
- `hono` — Web framework
- `drizzle-orm` + `drizzle-kit` — ORM + migrations
- `@hono/zod-validator` — Request validation
- `zod` — Schema validation
- `postgres` — PostgreSQL driver (Bun-native)
- `ioredis` — Redis client (Upstash compatible)
- `mongodb` — MongoDB driver (Atlas connection)
- `bullmq` — Job queue

**Auth & Security:**
- `better-auth` — Teacher/admin auth (email + password, sessions, admin plugin)
- `hono/jwt` — JWT middleware for student auth (built into Hono)
- `hono/cors` — CORS middleware (dual-origin: Unity game + React admin)
- `hono/secure-headers` — Security headers
- `nanoid` — Short ID generation (server codes, etc.)

**Utilities:**
- `pino` — Structured logging
- `date-fns` — Date manipulation
- `csv-stringify` — Grade CSV export

**Dev:**
- `@biomejs/biome` — Linter + formatter (replaces ESLint + Prettier)
- `@types/bun` — Bun type definitions
- `typescript` — TypeScript compiler

---

## 3. Architecture

### Communication Strategy (Hybrid)

| Protocol | Use Cases |
|----------|-----------|
| **REST** | Auth, CRUD, grade exports, content management, student profiles |
| **WebSocket** | Live game sessions, real-time challenge interactions, hub events, multiplayer |
| **SSE** | Teacher dashboard updates, leaderboard changes, progress notifications |

SSE was chosen over WebSocket for teacher dashboard because updates flow one direction (server → teacher). Simpler to implement, fewer connection management issues, and Hono supports it natively via `streamSSE`.

### Architectural Layers

```
Clients
  Unity (Student Game)     React TS (Teacher/Admin)
        │                         │
        ▼                         ▼
┌─────────────────────────────────────────────┐
│  API Gateway (Hono Router)                  │
│  REST │ WebSocket │ SSE                     │
├─────────────────────────────────────────────┤
│  Auth Middleware                             │
│  Better Auth (teacher/admin sessions)       │
│  Custom JWT (student bearer tokens)         │
├─────────────────────────────────────────────┤
│  Shared Middleware                           │
│  RateLimit │ Logger │ ErrorHandler │ RBAC   │
├─────────────────────────────────────────────┤
│  Feature Layer (src/features/*)             │
│  Each feature owns: table, routes, service, │
│  schema, types, tests, ws?, job?            │
├─────────────────────────────────────────────┤
│  Shared Services (src/shared/services/)     │
│  AdaptiveLearning │ WSManager               │
├─────────────────────────────────────────────┤
│  Data Layer                                 │
│  PostgreSQL (Aiven/Drizzle) │ Redis (Upstash)│
│  MongoDB Atlas │ BullMQ                      │
└─────────────────────────────────────────────┘
```

---

## 4. Project Structure

> **Organization: Feature-based modular.** Each feature is a self-contained folder
> owning its own table, routes, service, validation, types, tests, and optionally
> WebSocket handler and background job. Cross-cutting concerns live in `src/shared/`.

```
nutrimind-server/
├── src/
│   ├── index.ts                          # Entry point — server bootstrap + BullMQ workers
│   ├── app.ts                            # Hono app config — mounts all feature routes
│   │
│   ├── config/
│   │   ├── env.ts                        # Env validation (Zod schema)
│   │   ├── auth.ts                       # Better Auth server config (plugins, Drizzle adapter, Redis sessions)
│   │   ├── database.ts                   # PostgreSQL pool + Drizzle client (Aiven)
│   │   ├── redis.ts                      # Redis client with reconnect logic (Upstash)
│   │   ├── mongodb.ts                    # MongoDB Atlas client + connection
│   │   └── constants.ts                  # App-wide constants
│   │
│   ├── db/
│   │   ├── schema.ts                     # Barrel — re-exports all *.table.ts from features
│   │   ├── migrations/                   # Generated SQL migrations (drizzle-kit)
│   │   └── seed/                         # Curriculum seed data
│   │       ├── worlds.seed.ts
│   │       ├── challenges.seed.ts
│   │       └── badges.seed.ts
│   │
│   ├── features/                         # ⭐ Self-contained feature modules
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.routes.ts            # Better Auth handler mount + student login endpoint
│   │   │   ├── auth.service.ts           # Student auth logic (PIN login, JWT, refresh)
│   │   │   ├── auth.schema.ts            # Zod schemas for student login/refresh
│   │   │   ├── auth.types.ts             # TypeScript types
│   │   │   └── auth.test.ts              # Unit + integration tests
│   │   │
│   │   ├── admin/
│   │   │   ├── admin.routes.ts           # Teacher management, curriculum CRUD, school analytics
│   │   │   ├── admin.service.ts          # Admin business logic
│   │   │   ├── admin.schema.ts           # Zod schemas
│   │   │   ├── admin.types.ts
│   │   │   └── admin.test.ts
│   │   │
│   │   ├── teacher/
│   │   │   ├── teacher.routes.ts         # GET/PATCH /teachers/me
│   │   │   ├── teacher.service.ts        # Profile get/update
│   │   │   ├── teacher.schema.ts         # Zod schemas
│   │   │   ├── teacher.types.ts
│   │   │   └── teacher.test.ts
│   │   │
│   │   ├── student/
│   │   │   ├── student.table.ts          # students, student_refresh_tokens tables
│   │   │   ├── student.routes.ts         # CRUD + batch create
│   │   │   ├── student.service.ts        # Student management + PIN logic
│   │   │   ├── student.schema.ts
│   │   │   ├── student.types.ts
│   │   │   └── student.test.ts
│   │   │
│   │   ├── hub/
│   │   │   ├── hub.table.ts              # hubs, server_codes, hub_members tables
│   │   │   ├── hub.routes.ts             # Hub CRUD + join + members
│   │   │   ├── hub.service.ts            # Hub logic, code gen, membership
│   │   │   ├── hub.schema.ts
│   │   │   ├── hub.types.ts
│   │   │   ├── hub.ws.ts                 # Hub live events (member join/leave)
│   │   │   └── hub.test.ts
│   │   │
│   │   ├── challenge/
│   │   │   ├── challenge.table.ts        # worlds, zones, topics, challenges tables
│   │   │   ├── challenge.routes.ts       # World/zone/topic/challenge endpoints
│   │   │   ├── challenge.service.ts      # Challenge retrieval + answer submission
│   │   │   ├── challenge.schema.ts
│   │   │   ├── challenge.types.ts
│   │   │   ├── challenge.ws.ts           # Live game sessions + boss battles
│   │   │   └── challenge.test.ts
│   │   │
│   │   ├── progress/
│   │   │   ├── progress.table.ts         # student_progress, challenge_attempts, competency_scores
│   │   │   ├── progress.routes.ts        # Progress endpoints (student + teacher views)
│   │   │   ├── progress.service.ts       # Track progress, compute competency
│   │   │   ├── progress.schema.ts
│   │   │   ├── progress.types.ts
│   │   │   └── progress.test.ts
│   │   │
│   │   ├── gamification/
│   │   │   ├── gamification.table.ts     # badges, student_badges, streaks
│   │   │   ├── gamification.routes.ts    # Badges, streaks, hero, leaderboard
│   │   │   ├── gamification.service.ts   # Badge checking, streak logic, hero power, leaderboard
│   │   │   ├── gamification.schema.ts
│   │   │   ├── gamification.types.ts
│   │   │   ├── gamification.job.ts       # BullMQ: streak reset
│   │   │   └── gamification.test.ts
│   │   │
│   │   ├── daily-challenge/
│   │   │   ├── daily-challenge.table.ts  # daily_challenges, daily_challenge_completions
│   │   │   ├── daily-challenge.routes.ts # Get + complete daily challenges
│   │   │   ├── daily-challenge.service.ts
│   │   │   ├── daily-challenge.schema.ts
│   │   │   ├── daily-challenge.types.ts
│   │   │   ├── daily-challenge.job.ts    # BullMQ: generate next day's challenges
│   │   │   └── daily-challenge.test.ts
│   │   │
│   │   ├── grading/
│   │   │   ├── grading.table.ts          # grades table
│   │   │   ├── grading.routes.ts         # View, compute, export grades
│   │   │   ├── grading.service.ts        # DepEd computation + transmutation
│   │   │   ├── grading.schema.ts
│   │   │   ├── grading.types.ts
│   │   │   ├── grading.job.ts            # BullMQ: batch grade recomputation
│   │   │   └── grading.test.ts
│   │   │
│   │   ├── dashboard/
│   │   │   ├── dashboard.routes.ts       # REST stats + SSE stream
│   │   │   ├── dashboard.service.ts      # Overview stats, at-risk detection
│   │   │   ├── dashboard.schema.ts
│   │   │   ├── dashboard.types.ts
│   │   │   └── dashboard.test.ts
│   │   │
│   │   └── sync/
│   │       ├── sync.routes.ts            # Content-pack download endpoint
│   │       ├── sync.service.ts           # Content pack generation (offline practice bundles)
│   │       ├── sync.schema.ts
│   │       ├── sync.types.ts
│   │       └── sync.test.ts
│   │
│   │   └── analytics/
│   │       ├── analytics.routes.ts       # Event ingestion + query endpoints
│   │       ├── analytics.service.ts      # MongoDB writes: game events, telemetry, session logs
│   │       ├── analytics.schema.ts       # Zod schemas for event payloads
│   │       ├── analytics.types.ts
│   │       └── analytics.test.ts
│   │
│   └── shared/                           # Cross-cutting concerns
│       ├── middleware/
│       │   ├── student-auth.ts           # Custom JWT verification for student routes
│       │   ├── role.ts                   # Role-based access control (admin/teacher/student)
│       │   ├── rate-limit.ts             # Redis-backed rate limiting
│       │   ├── error-handler.ts          # Global error handler
│       │   └── logger.ts                 # Request logging (pino)
│       │
│       ├── lib/
│       │   ├── errors.ts                 # Custom error classes
│       │   ├── response.ts               # Standardized success/error responses
│       │   ├── pagination.ts             # Cursor + offset pagination
│       │   ├── server-code.ts            # 6-char alphanumeric code gen
│       │   └── anti-cheat.ts             # Server-side answer validation
│       │
│       ├── services/
│       │   ├── adaptive-learning.ts      # Difficulty adjustment engine
│       │   └── ws-manager.ts             # WebSocket connection manager + rooms
│       │
│       └── types/
│           ├── env.d.ts
│           ├── game.types.ts
│           └── api.types.ts
│
├── drizzle/                              # Generated migration SQL files
├── scripts/
│   ├── seed.ts                           # Database seeding runner
│   └── migrate.ts                        # Migration runner
│
├── .env.example
├── package.json
├── tsconfig.json
├── biome.json                                # Biome linter + formatter config
├── drizzle.config.ts
└── README.md
```

### Feature Module Convention

Every feature folder follows this pattern:

| File | Required | Purpose |
|------|----------|---------|
| `{feature}.table.ts` | If feature owns DB tables | Drizzle table definitions + relations |
| `{feature}.routes.ts` | Yes | Hono route handlers (mounted in `app.ts`) |
| `{feature}.service.ts` | Yes | Business logic (pure functions where possible) |
| `{feature}.schema.ts` | Yes | Zod validation schemas for requests/responses |
| `{feature}.types.ts` | Yes | TypeScript types and interfaces |
| `{feature}.test.ts` | Yes | Unit + integration tests (colocated) |
| `{feature}.ws.ts` | Only if WebSocket needed | WebSocket event handlers for that feature |
| `{feature}.job.ts` | Only if background jobs needed | BullMQ job definitions + processors |

**Schema barrel file** (`src/db/schema.ts`) re-exports all `*.table.ts` files from every feature. This is required for Drizzle to infer relations across features.

### Development Prerequisites

All database services are **cloud-hosted** — no local installs needed:

| Service | Provider | Connection |
|---------|----------|------------|
| **PostgreSQL** | Aiven | Remote connection via `DATABASE_URL` (SSL required) |
| **Redis** | Upstash | Remote connection via `UPSTASH_REDIS_URL` (REST or ioredis) |
| **MongoDB** | MongoDB Atlas | Remote connection via `MONGODB_URI` |

> No local database setup required. Use cloud service dashboards to manage instances.
> Use `bun run dev` to start the Hono server with `--hot` for live reload.
> Run `bun run check` to lint and format with Biome.

---

## 5. Environment Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment |
| `DATABASE_URL` | `postgresql://user:pass@host:port/db?sslmode=require` | Aiven PostgreSQL connection (SSL) |
| `UPSTASH_REDIS_URL` | `rediss://default:token@host:port` | Upstash Redis connection |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/nutrimind` | MongoDB Atlas connection |
| `BETTER_AUTH_SECRET` | (random 32+ chars) | Better Auth encryption secret |
| `BETTER_AUTH_URL` | `http://localhost:3000` | Better Auth base URL |
| `JWT_SECRET` | (random 64 chars) | JWT signing key (student auth only) |
| `JWT_ACCESS_EXPIRY` | `15m` | Student access token TTL |
| `JWT_REFRESH_EXPIRY` | `7d` | Student refresh token TTL |
| `SERVER_CODE_LENGTH` | `6` | Hub join code length |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3001` | Allowed origins (React admin + Unity dev) |
| `LOG_LEVEL` | `info` | Logging verbosity |
| `RATE_LIMIT_WINDOW` | `60000` | Rate limit window (ms) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `LOGIN_RATE_LIMIT_MAX` | `5` | Max student login attempts per window |

---

## 6. API Versioning Strategy

All API routes are prefixed with `/api/v1/`. This allows:
- Mobile app users on older versions to continue working
- Gradual migration when breaking changes are needed
- New features deployed on `/api/v2/` without breaking existing clients

---

## 7. Error Response Format

All API errors follow a consistent structure:

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `false` for errors |
| `error.code` | string | Machine-readable error code (e.g., `AUTH_INVALID_PIN`) |
| `error.message` | string | Human-readable description |
| `error.details` | object? | Optional validation details |

Success responses follow:

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` |
| `data` | any | Response payload |
| `meta` | object? | Pagination info, etc. |
