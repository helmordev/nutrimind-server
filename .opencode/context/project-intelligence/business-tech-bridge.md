<!-- Context: project-intelligence/bridge | Priority: critical | Version: 1.1 | Updated: 2026-04-04 -->

# Business ↔ Tech Bridge — NutriMind EDU

> How each business need maps to a specific technical solution, and why.

## Core Mapping

| Business Need | Technical Solution | Why This Mapping |
|---------------|-------------------|-----------------|
| Students use PIN, not email | Custom JWT (Student ID + 6-digit PIN → access + refresh tokens) | Unity can't handle cookie sessions; PIN is school-mandated |
| Teachers/Admin need secure web login | Better Auth (email+password, cookie sessions, admin plugin) | Full session management, CSRF protection, role enforcement |
| Real-time teacher dashboard | Hono `streamSSE` — one-way server push to React admin | Teachers observe, never send data back; SSE is simpler than WS |
| Live student game state sync | Hono native WebSocket per feature (`{feature}.ws.ts`) | Bidirectional needed for boss battles, live XP updates |
| Gamification jobs (badges, XP) don't block gameplay | BullMQ (Redis-backed job queue) | Badge award and leaderboard recalc are async, fire-and-forget |
| Adaptive difficulty (weak topics) | MongoDB Atlas — flexible schema for per-student event logs | Event data is high-volume and schema-varies; doesn't fit SQL |
| Challenge anti-cheat (no duplicate submit) | Redis active-challenge lock key per student | Atomic Redis set/del prevents duplicate scoring from Unity |
| Class management (teachers + students) | Hub feature (`src/features/hub/`) with PostgreSQL | Relational: teacher owns hub, students are members, roles enforced |
| Grade 5–6 content (English/Science/PE) | Worlds → Zones → Topics → Challenges hierarchy in PostgreSQL | Tree structure suits Drizzle's relational queries |
| No local infrastructure for school | Aiven (PG) + Upstash (Redis) + MongoDB Atlas — all managed cloud | School has no IT ops capacity; zero local setup required |

## Feature Mappings

### Dual Authentication

**Business Context**: Two very different user types — students (young, PIN-only, Unity game) and staff (teachers/admin, web browser, email+password).

**Technical Implementation**:
- Students → `src/shared/middleware/student-auth.ts` validates `Authorization: Bearer <jwt>`
- Teachers/Admin → `betterAuthMiddleware` validates `better-auth.session_token` cookie
- Role guard applied after auth: `requireRole('admin')` / `requireRole('teacher')`

**Connection**: Unity C# cannot manage cookies; JWT in Authorization header is the only viable path. Better Auth handles the complexity of teacher session management (refresh, revoke, 2FA-ready).

---

### Gamification Pipeline

**Business Context**: XP, badges, streaks, and leaderboards must feel instant to students but are computationally expensive.

**Technical Implementation**:
- Challenge submit → immediate XP delta returned in HTTP response
- Badge check + leaderboard recalc → fired as BullMQ job (`gamification.job.ts`)
- Streak update → Redis counter, flushed to PostgreSQL nightly

**Connection**: Fire-and-forget async jobs keep the gameplay loop under 200ms. Students never wait for badge computation.

---

### Adaptive Learning

**Business Context**: Students who fail a topic repeatedly should get more practice on that topic, not move forward.

**Technical Implementation**:
- Every challenge attempt writes an event to MongoDB Atlas (timestamp, topic, correct/incorrect, time-taken)
- `src/shared/services/adaptive-learning.ts` queries MongoDB to find weak topics per student
- Next-zone recommendation returned in progress API response

**Connection**: MongoDB's flexible document model handles high-volume event writes without schema migrations. The adaptive engine runs as a read against Atlas, keeping PostgreSQL clean.

---

### Anti-Cheat (Server-Side Validation)

**Business Context**: Unity client sends answers — students (or modded clients) could fake correct answers.

**Technical Implementation**:
- Correct answer stored server-side only (never sent to client)
- On submit: server fetches challenge, validates answer, scores server-side
- Redis lock: `challenge:lock:{studentId}:{challengeId}` prevents double-submit

**Connection**: Game integrity is non-negotiable for meaningful leaderboards and adaptive data. Zero trust on the Unity client.

## Trade-off Decisions

| Situation | Business Priority | Technical Priority | Decision |
|-----------|-------------------|-------------------|----------|
| Student auth method | PIN-only (school policy) | Cookie sessions simpler | Custom JWT — unity compatibility wins |
| Analytics storage | Rich event data needed | SQL schema changes are costly | MongoDB for analytics, PG for structured |
| Job processing | Instant feel for students | Accuracy of badge awards | BullMQ async — speed wins, eventual consistency acceptable |
| Dual client support | One API for Unity + React | API design complexity | Single Hono server, dual auth middleware |

## 📂 Codebase References

- `src/shared/middleware/student-auth.ts` — JWT validation for Unity client
- `src/shared/middleware/role.ts` — Role guard (`requireRole`)
- `src/config/auth.ts` — Better Auth configuration
- `src/shared/services/adaptive-learning.ts` — Weak topic detection
- `src/shared/lib/anti-cheat.ts` — Challenge lock helpers
- `src/features/gamification/gamification.job.ts` — Async badge/XP jobs
- `src/config/mongodb.ts` — MongoDB Atlas connection

## Related Files

- `business-domain.md` — Full business context
- `technical-domain.md` — Full technical stack
- `decisions-log.md` — Decision rationale with alternatives
