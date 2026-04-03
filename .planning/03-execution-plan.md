# NutriMind Server — Execution Plan

**Generated**: 2026-04-03
**Estimated Total Duration**: 9-11 sprints (5-6 weeks at 2 sprints/week)
**Approach**: Incremental, each sprint produces a runnable/testable increment

---

## Sprint 0: Project Bootstrap
**Goal**: Runnable Hono server with database connection and basic middleware.

**Tasks:**
1. Initialize Bun project with `bun init` // skip if already done
2. Install all core dependencies (hono, drizzle-orm, postgres, ioredis, mongodb, zod, pino, nanoid, bullmq, better-auth)
3. Install dev dependencies (drizzle-kit, @biomejs/biome, @types/bun, typescript)
4. Create project folder structure (all directories from architecture doc — `src/config/`, `src/db/`, `src/features/`, `src/shared/`)
5. Set up tsconfig.json optimized for Bun
6. Set up `biome.json` — configure linter + formatter rules (Biome replaces ESLint + Prettier)
7. Create drizzle.config.ts
8. Create `src/config/env.ts` — Zod schema to validate all environment variables (DATABASE_URL for Aiven PG, UPSTASH_REDIS_URL, MONGODB_URI for Atlas, BETTER_AUTH_SECRET, etc.)
9. Create `src/config/database.ts` — PostgreSQL pool + Drizzle client (Aiven connection with SSL)
10. Create `src/config/redis.ts` — Redis client with reconnect logic (Upstash REST or ioredis)
11. Create `src/config/mongodb.ts` — MongoDB Atlas client + connection pooling
12. Create `src/config/auth.ts` — Better Auth server config (Drizzle adapter, Redis secondaryStorage, admin + bearer plugins, email+password enabled, additionalFields for user)
13. Create `src/app.ts` — Hono app with base middleware (logger, cors, secureHeaders, requestId)
14. Create `src/shared/middleware/error-handler.ts` — Global error handler
15. Create `src/shared/middleware/logger.ts` — Request logging via pino
16. Create `src/shared/lib/response.ts` — Standardized success/error response helpers
17. Create `src/shared/lib/errors.ts` — Custom error classes (AppError, NotFoundError, ValidationError, AuthError)
18. Create `src/index.ts` — Server bootstrap (Bun.serve with Hono app)
19. Create `src/db/schema.ts` — Barrel file that re-exports all feature `*.table.ts` files
20. Create .env.example with all variables documented (DATABASE_URL, UPSTASH_REDIS_URL, MONGODB_URI, BETTER_AUTH_SECRET, BETTER_AUTH_URL, CORS_ORIGINS, STUDENT_JWT_SECRET)
21. Verify Aiven PostgreSQL is accessible (test connection with SSL)
22. Verify Upstash Redis is accessible (test connection)
23. Verify MongoDB Atlas is accessible (test connection)
24. Verify: `bun run src/index.ts` starts, `GET /health` returns 200

**Demo**: Server running on port 3000, health check responding, Aiven PostgreSQL + Upstash Redis + MongoDB Atlas connected.
---

## Sprint 1: Auth System (Better Auth + Student JWT)
**Goal**: Teachers/admins authenticate via Better Auth (cookie sessions). Students authenticate via custom JWT (PIN-based).

**Tasks:**
1. Mount Better Auth handler on Hono (`app.on(["POST","GET"], "/api/auth/**", betterAuthHandler)`)
2. Run Better Auth CLI: `bunx @better-auth/cli@latest generate` — generates Drizzle schema for user, session, account, verification tables
3. Run migration: `bunx drizzle-kit generate && bunx drizzle-kit migrate`
4. Verify Better Auth: `GET /api/auth/ok` returns `{ status: "ok" }`
5. Create `src/shared/middleware/better-auth.ts` — Middleware that validates Better Auth session from cookie/bearer token, attaches user to context
6. Create `src/shared/middleware/student-auth.ts` — Custom JWT verification middleware for student bearer tokens
7. Create `src/shared/middleware/role.ts` — Role-based access guard (requireRole('admin'), requireRole('teacher'), requireRole('student'))
8. Create `src/shared/middleware/rate-limit.ts` — Redis-backed rate limiter
9. Create `src/features/auth/auth.schema.ts` — Zod schemas for student login/refresh payloads
10. Create `src/features/auth/auth.service.ts` — Student auth logic: login (studentID+PIN), refresh token, logout
11. Create `src/features/auth/auth.routes.ts` — POST student/login, student/refresh, student/logout
12. Create `src/features/auth/auth.types.ts` — TypeScript types for student auth
13. Create `src/features/teacher/teacher.schema.ts` — Profile update schemas
14. Create `src/features/teacher/teacher.service.ts` — Get/update own profile (additionalFields: firstName, lastName, school)
15. Create `src/features/teacher/teacher.routes.ts` — GET/PATCH /teachers/me (protected by Better Auth session)
16. Create `src/features/teacher/teacher.types.ts`
17. Create `src/features/admin/admin.schema.ts` — Teacher management schemas (create, deactivate, update, role change)
18. Create `src/features/admin/admin.service.ts` — List teachers, create, deactivate, update, change role
19. Create `src/features/admin/admin.routes.ts` — All admin endpoints (protected by requireRole('admin'))
20. Create `src/features/admin/admin.types.ts`
21. Apply rate limiting to student login (5/min per studentID)
22. Seed initial admin user via Better Auth (email: admin@nutrimind.edu, role: 'admin')
23. Write `src/features/auth/auth.test.ts` — tests for student login, PIN lockout, refresh, logout
24. Write `src/features/teacher/teacher.test.ts` — tests for teacher profile CRUD
25. Write `src/features/admin/admin.test.ts` — tests for teacher creation flow, role management

**Demo**: Admin logs in via Better Auth → creates teacher account → Teacher logs in → accesses profile. Student logs in with PIN → gets JWT → accesses protected route → refreshes token.

---

## Sprint 2: Student Schema + Hub System
**Goal**: Teachers can create students, hubs, and generate server codes. Students can join hubs.

**Tasks:**
1. Create `src/features/student/student.table.ts` — students table + student_refresh_tokens table
2. Create `src/features/hub/hub.table.ts` — hubs (teacher_id: varchar(36) FK → user.id), server_codes (created_by: varchar(36) FK → user.id), hub_members tables
3. Update `src/db/schema.ts` — re-export student + hub tables
4. Generate and run migration
5. Create `src/shared/lib/server-code.ts` — 6-char alphanumeric code generator (no ambiguous chars)
6. Create `src/features/student/student.schema.ts` — Create, update, batch create schemas
7. Create `src/features/student/student.service.ts` — CRUD + PIN reset + batch create
8. Create `src/features/student/student.routes.ts` — All student CRUD endpoints
9. Create `src/features/student/student.types.ts`
10. Create `src/features/hub/hub.schema.ts` — Hub CRUD + code generation schemas
11. Create `src/features/hub/hub.service.ts` — Hub CRUD, code generation, join logic, member management
12. Create `src/features/hub/hub.routes.ts` — All hub endpoints
13. Create `src/features/hub/hub.types.ts`
14. Student login: implement in `src/features/auth/auth.service.ts` (studentID + PIN → JWT, rate limiting, lockout, store refresh token in student_refresh_tokens)
15. Server code Redis caching: store code → hubId mapping for fast lookup
16. Write `src/features/student/student.test.ts` — tests for student CRUD + PIN lockout
17. Write `src/features/hub/hub.test.ts` — tests for hub operations + code join flow

**Demo**: Teacher creates hub → generates code → student created with PIN → student joins hub with code → teacher sees student in hub members. Admin can view all hubs.

---

## Sprint 3: World Content Schema + Seed Data + Teacher Challenge CRUD
**Goal**: Game worlds, zones, and topics exist in the database with curriculum-aligned seed data. Teachers can create and manage challenge content per hub.

**Tasks:**
1. Create `src/features/challenge/challenge.table.ts` — worlds, zones, topics, challenges tables (challenges include hub_id + created_by columns)
2. Update `src/db/schema.ts` — re-export challenge tables
3. Generate and run migration
4. Create `src/db/seed/worlds.seed.ts` — Seed 3 worlds (Literacy Island, Science Frontier + Health City, PE Arena)
5. Create zone seeds for all 4 quarters × 2 grade levels × 3 subject hubs = ~24 zones
6. Create topic seeds — aligned with curriculum documents (8 weeks per zone)
7. Create `scripts/seed.ts` — Seed runner that executes all seeds in order (worlds → zones → topics only; challenges are teacher-created)
8. Create `src/features/challenge/challenge.schema.ts` — Schemas for both teacher CRUD and student query/submit
9. Create `src/features/challenge/challenge.service.ts`:
   - **Teacher operations:** Create challenge, batch create, update, soft delete, duplicate, list by hub, list by topic, coverage stats
   - **Student operations:** Get challenges by topic (filtered by hub + adaptive difficulty), submit answer
10. Create `src/features/challenge/challenge.routes.ts`:
    - Teacher routes (protected by Better Auth session + requireRole('teacher')): POST create, POST batch, PATCH update, DELETE, POST duplicate, GET list, GET stats
    - Student routes (protected by student JWT): GET challenges, POST submit, GET result
11. Create `src/features/challenge/challenge.types.ts`
12. Create `src/shared/lib/anti-cheat.ts` — Server-side answer validation + time check
13. Challenge submit endpoint with server-side validation
14. Write `src/features/challenge/challenge.test.ts` — tests for teacher CRUD (create, batch, update, delete, duplicate), student retrieval, and submission

**Demo**: Teacher creates challenges for a topic in their hub → Student navigates Literacy Island → sees Q1 Forest of Words zone → gets Week 1 topics → plays teacher-created challenges → submits answers → receives validated results.

---

## Sprint 4: Progress Tracking + Adaptive Learning
**Goal**: Student progress is tracked. Adaptive engine adjusts difficulty.

**Tasks:**
1. Create `src/features/progress/progress.table.ts` — student_progress, challenge_attempts, competency_scores tables
2. Update `src/db/schema.ts` — re-export progress tables
3. Generate and run migration
4. Create `src/features/progress/progress.service.ts` — Track progress, update completion, compute competency
5. Create `src/shared/services/adaptive-learning.ts` — Difficulty adjustment algorithm:
   - Calculate competency score (weighted recent average)
   - Map score to difficulty level (1-5)
   - Filter challenges by current difficulty
   - Adjust on consecutive correct/incorrect
6. Create `src/features/progress/progress.routes.ts` — Progress endpoints (student + teacher views)
7. Create `src/features/progress/progress.schema.ts`
8. Create `src/features/progress/progress.types.ts`
9. Integrate adaptive engine into challenge retrieval (`challenge.service` filters by mastery_level)
10. Implement boss battle unlock logic: ≥80% completion + ≥70% accuracy → boss_unlocked = true
11. Create `src/shared/lib/pagination.ts` — Cursor + offset pagination helper
12. Write `src/features/progress/progress.test.ts` — tests for competency, adaptive difficulty, boss unlock

**Demo**: Student completes challenges → competency scores update → difficulty adjusts → after enough progress, boss battle unlocks.

---

## Sprint 5: Gamification System
**Goal**: Badges, streaks, hero power level, daily challenges, and leaderboards.

**Tasks:**
1. Create `src/features/gamification/gamification.table.ts` — badges, student_badges, streaks tables
2. Create `src/features/daily-challenge/daily-challenge.table.ts` — daily_challenges, daily_challenge_completions tables
3. Update `src/db/schema.ts` — re-export gamification + daily-challenge tables
4. Generate and run migration
5. Create `src/db/seed/badges.seed.ts` — Seed all badge definitions with criteria
6. Create `src/features/gamification/gamification.service.ts`:
   - Badge checking logic (evaluate criteria against student state)
   - Streak update logic (increment/reset based on daily activity)
   - Hero power level calculation
   - Leaderboard updates (Redis sorted sets)
7. Create `src/features/gamification/gamification.routes.ts` — Badges, streaks, hero, leaderboard endpoints
8. Create `src/features/gamification/gamification.schema.ts`
9. Create `src/features/gamification/gamification.types.ts`
10. Create `src/features/daily-challenge/daily-challenge.service.ts` — Generate daily cards
11. Create `src/features/daily-challenge/daily-challenge.routes.ts` — Get + complete daily challenges
12. Create `src/features/daily-challenge/daily-challenge.schema.ts`
13. Create `src/features/daily-challenge/daily-challenge.types.ts`
14. Create `src/features/daily-challenge/daily-challenge.job.ts` — BullMQ job to generate next day's challenges at midnight
15. Create `src/features/gamification/gamification.job.ts` — BullMQ job to reset expired streaks
16. Integrate badge checking into challenge submission flow (auto-award on criteria met)
17. Set up BullMQ worker registration in `src/index.ts`
18. Write `src/features/gamification/gamification.test.ts` — tests for badges, streaks, hero power
19. Write `src/features/daily-challenge/daily-challenge.test.ts` — tests for daily challenge flow

**Demo**: Student completes challenges → earns badge → streak increments → hero power increases → appears on leaderboard → daily challenge card available.

---

## Sprint 6: Grading System
**Goal**: DepEd-aligned grades are computed and exportable.

**Tasks:**
1. Create `src/features/grading/grading.table.ts` — grades table
2. Update `src/db/schema.ts` — re-export grading tables
3. Generate and run migration
4. Create `src/features/grading/grading.service.ts`:
   - Aggregate challenge_attempts by category (written_work, performance_task, quarterly_assessment)
   - Compute raw scores per category
   - Apply DepEd weights: WW×0.25 + PT×0.50 + QA×0.25
   - Transmute to DepEd 75-100 scale
   - Generate remarks (Outstanding, Very Satisfactory, Satisfactory, Fairly Satisfactory, Did Not Meet)
   - CSV export with proper DepEd format
5. Create `src/features/grading/grading.routes.ts` — Grade endpoints (view, compute, export)
6. Create `src/features/grading/grading.schema.ts`
7. Create `src/features/grading/grading.types.ts`
8. Create `src/features/grading/grading.job.ts` — BullMQ job for batch grade recomputation
9. Write `src/features/grading/grading.test.ts` — tests for computation, transmutation, CSV export

**Demo**: Teacher triggers grade computation → grades appear with proper DepEd format → exports CSV file.

---

## Sprint 7: WebSocket + Real-time Features
**Goal**: Live game sessions and real-time interactions via WebSocket.

**Tasks:**
1. Create `src/shared/services/ws-manager.ts` — WebSocket connection manager (dual auth: student JWT or Better Auth bearer token, rooms, broadcast)
2. Create `src/features/challenge/challenge.ws.ts` — Game session events (start challenge, submit answer, boss battle phases)
3. Create `src/features/hub/hub.ws.ts` — Hub live events (member join/leave, activity)
4. Integrate WebSocket upgrade in `src/app.ts` using Hono's `upgradeWebSocket`
5. Redis pub/sub for multi-instance support (if scaling later)
6. Active challenge tracking in Redis (anti-cheat: prevent double submissions)
7. Real-time leaderboard updates via WebSocket broadcast
8. Boss battle multi-phase flow via WebSocket
9. Write WebSocket tests in `src/features/challenge/challenge.test.ts` (extend existing)
10. Write WebSocket tests in `src/features/hub/hub.test.ts` (extend existing)

**Demo**: Student connects via WebSocket → starts challenge → submits answer in real-time → boss battle works → leaderboard updates live.

---

## Sprint 8: Teacher/Admin Dashboard + SSE
**Goal**: Teachers and admins have a real-time dashboard with SSE updates.

**Tasks:**
1. Create `src/features/dashboard/dashboard.service.ts`:
   - Overview stats (total students, active today, average grade, completion rates)
   - Hub-specific analytics
   - At-risk student detection (grade < 75, low activity, declining scores)
   - Competency breakdown per topic
2. Create `src/features/dashboard/dashboard.routes.ts` — REST endpoints + SSE stream
3. Create `src/features/dashboard/dashboard.schema.ts`
4. Create `src/features/dashboard/dashboard.types.ts`
5. Implement SSE endpoint using Hono's `streamSSE` (protected by Better Auth session):
    - Subscribe to Redis pub/sub channels for relevant events
    - Stream events to connected teachers/admins
6. At-risk student algorithm:
   - Grade trending below 75
   - No activity in 3+ days
   - Declining competency scores
   - Failing > 50% of recent challenges
7. Write `src/features/dashboard/dashboard.test.ts` — tests for stats, at-risk detection, SSE delivery

**Demo**: Teacher/admin opens dashboard → sees live stats → student completes challenge → dashboard updates in real-time → at-risk student flagged with alert. Admin sees school-wide analytics.

---

## Sprint 9: Offline Content Packs
**Goal**: Students can download content packs for independent offline practice.

**Tasks:**
1. Create `src/features/sync/sync.service.ts`:
   - Content pack generation (current zone challenges, daily challenges, metadata)
   - Bundle format: JSON with challenges, badge definitions, world/zone metadata
   - Gzip compression for transfer
2. Create `src/features/sync/sync.routes.ts` — GET /sync/content-pack (protected by student JWT)
3. Create `src/features/sync/sync.schema.ts` — Content pack query params (gradeLevel, quarter)
4. Create `src/features/sync/sync.types.ts`
5. Content pack includes: current zone challenges (all difficulties), next zone preview (week 1), daily challenges (next 3 days), badge definitions, world/zone metadata (~700KB total)
6. No offline_sync_queue table — offline practice is independent, stored only on device
7. No sync upload endpoint — offline attempts never reach the server
8. Write `src/features/sync/sync.test.ts` — tests for content pack generation, compression, proper data inclusion

**Demo**: Student requests content pack → receives compressed JSON bundle → can practice offline → offline data stays on device only.

---

## Sprint 10: Analytics & Telemetry (MongoDB Atlas)
**Goal**: Game events, player sessions, and teacher activity are tracked in MongoDB Atlas for analytics and reporting.

**Tasks:**
1. Create `src/features/analytics/analytics.service.ts`:
   - Log game events (challenge started/completed, zone completed, boss battle, badge earned)
   - Player session tracking (start/end, duration, activity counts)
   - Teacher activity audit log (challenge CRUD, student management, grade exports)
   - Hub-level engagement summaries (aggregation queries)
   - Admin-level school-wide analytics overview
2. Create `src/features/analytics/analytics.routes.ts`:
   - Student routes (JWT): POST event, POST batch events, POST session start/end
   - Teacher routes (Session): GET hub summary, GET student activity breakdown
   - Admin routes (Session): GET school-wide overview
3. Create `src/features/analytics/analytics.schema.ts` — Zod schemas for event payloads
4. Create `src/features/analytics/analytics.types.ts`
5. Integrate automatic server-side event logging into existing services:
   - Challenge service: log challenge_started, challenge_completed events
   - Gamification service: log badge_earned, streak_updated events
   - Grading service: log grade_computed events
6. Fire-and-forget pattern: analytics writes must not block game flow; wrap in try/catch, log failures silently
7. MongoDB indexes for efficient queries (event_type + created_at, student_id + created_at, hub_id + event_type)
8. Write `src/features/analytics/analytics.test.ts` — tests for event logging, session tracking, aggregation queries

**Demo**: Student plays game → events logged to MongoDB → teacher views hub engagement summary → admin sees school-wide analytics.

---

## Sprint 11: Polish + Deployment Prep
**Goal**: Production-ready application with documentation and deployment configuration.

**Tasks:**
1. Health check endpoint with dependency status (Aiven PG, Upstash Redis, MongoDB Atlas)
2. API documentation (endpoint list with request/response examples)
3. Seed script for production initial data (worlds, zones, topics, badges — challenges are teacher-created per hub)
4. Environment-specific configuration (dev, staging, production)
5. Database backup strategy documentation
6. Performance testing on key endpoints (challenge submit, grade compute, leaderboard)
7. Security audit checklist:
    - All inputs validated with Zod
    - SQL injection prevented (Drizzle parameterized queries)
    - Rate limiting on all endpoints
    - CORS properly configured (dual-origin: Unity + React TS admin panel)
    - Secure headers applied
    - Better Auth session cookies: httpOnly, secure, sameSite
    - Student JWT secrets properly managed (STUDENT_JWT_SECRET)
    - Better Auth secret properly managed (BETTER_AUTH_SECRET)
    - PIN hashing verified (bcrypt cost ≥ 10)
    - Admin routes require role: 'admin'
8. Final integration test suite run
9. README.md with local setup, dev workflow, and deployment instructions
10. Deployment guide (hosting options: Railway, Render, VPS with PM2)

**Demo**: Full application running locally → all features working → tests passing → documentation complete → ready for deployment.

---

## Testing Strategy

| Level | Tool | Coverage |
|-------|------|----------|
| **Unit** | bun:test | Service functions, utility functions, validators |
| **Integration** | bun:test + app.request() | API routes end-to-end (Hono's built-in test method) |
| **WebSocket** | bun:test + WS client | WebSocket connection, events, game flow |

Tests are **colocated** with their feature in `{feature}.test.ts` files, not in a separate `tests/` directory.

**Key test scenarios:**
- Auth: Better Auth teacher/admin login (session), student PIN login (JWT), token refresh, lockout, admin creates teacher flow
- Hub: Create, join with code, code expiration, member management
- Challenge: Teacher creates/updates/deletes challenges, batch create, duplicate; student submit correct/incorrect, adaptive difficulty adjustment
- Grading: DepEd score computation, transmutation accuracy
- Anti-cheat: Time validation, attempt limits, active challenge lock
- Sync: Content pack generation, data completeness checks
- Analytics: Event logging, session tracking, hub/admin aggregation queries, fire-and-forget resilience

---

## Potential Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Teacher content authoring burden** | High | Medium | Provide batch create + duplicate tools; start with Grade 5 Q1 for all subjects, expand incrementally |
| **Speech recognition complexity** | Medium | High | Defer to Phase 2; use third-party API (Web Speech API or Google STT) |
| **WebSocket scaling** | Low | Medium | Redis pub/sub for multi-instance; start single-instance |
| **Offline sync conflicts** | Low | Low | Eliminated by design: offline = independent practice only, no server sync |
| **DepEd grading edge cases** | Medium | High | Document transmutation table explicitly; test with real grade distributions |
| **Mobile app performance** | Medium | Medium | Server-side filtering and pagination; small response payloads |

---

## Deferred to Phase 2

These features are scoped out of the initial build:

- **Speech recognition** — English oral fluency challenges via third-party API
- **Cross-world missions** — Multi-subject integrated challenges
- **Parent portal** — Parent access to view student progress
- **Multi-school support** — Currently hardcoded to Tayug Central Elementary
- **Advanced analytics** — ML-based learning pattern analysis (basic analytics via MongoDB Atlas included in Phase 1)
- **Push notifications** — Mobile push via FCM (requires mobile app integration)
- **Notification service** — Build basic in-app notifications first
- **Docker containerization** — Add Dockerfile + docker-compose when deploying to production
