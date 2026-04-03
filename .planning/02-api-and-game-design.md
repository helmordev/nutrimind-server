# NutriMind Server — API & Game Design

**Generated**: 2026-04-03

---

## 1. REST API Endpoints

All routes prefixed with `/api/v1`.

### Auth — Teacher/Admin (Better Auth)

Better Auth handles all teacher/admin authentication at `/api/auth/*` (mounted outside `/api/v1`).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/sign-in/email` | None | Teacher/Admin login (email + password) |
| POST | `/api/auth/sign-out` | Session | Logout (revoke session) |
| GET | `/api/auth/get-session` | Session | Get current session + user |
| POST | `/api/auth/change-password` | Session | Change password |
| POST | `/api/auth/forget-password` | None | Request password reset email |
| POST | `/api/auth/reset-password` | None | Reset password with token |

> **Client:** React TS admin panel. Auth uses **cookie-based sessions** managed by Better Auth.
> Sessions stored in Redis (`secondaryStorage`). No JWTs involved.

**Teacher Account Creation:**
1. Admin creates teacher via `POST /api/v1/admin/teachers` → account auto-approved, `isActive: true`, `role: 'teacher'`
2. No teacher self-registration — admin controls all teacher accounts
3. Teacher logs in via Better Auth → accesses dashboard

### Auth — Student (Custom JWT)

Custom student authentication at `/api/v1/auth/student/*`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/student/login` | None | Student login (studentID + PIN) |
| POST | `/auth/student/refresh` | Refresh Token | Refresh access token |
| POST | `/auth/student/logout` | Access Token | Revoke refresh token |

> **Client:** Unity game client. Auth uses **Bearer JWT tokens** (access + refresh).

**Student Auth Flow:**
1. Student sends studentID + PIN → server validates → returns access token (15m) + refresh token (7d)
2. Access token is JWT containing: studentId, hubIds
3. Refresh token is opaque, stored hashed in `student_refresh_tokens` table
4. Unity client uses `Authorization: Bearer <token>` header
5. When access token expires, client sends refresh token to `/auth/student/refresh`
6. On logout, refresh token is deleted from DB

**Student Login Security:**
- Rate limited: 5 attempts per minute per student ID
- Auto-lockout after 10 consecutive failures (teacher/admin must reset)
- PIN is hashed with bcrypt (Bun.password.hash)

### Teacher Module

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/teachers/me` | Teacher (Session) | Get own profile (additionalFields) |
| PATCH | `/teachers/me` | Teacher (Session) | Update profile (firstName, lastName, school) |

> Password change handled by Better Auth (`/api/auth/change-password`).

### Admin Module

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/teachers` | Admin | List all teachers (with filters) |
| POST | `/admin/teachers` | Admin | Create teacher account (auto-approved) |
| PATCH | `/admin/teachers/:id` | Admin | Update teacher (name, school, active status) |
| PATCH | `/admin/teachers/:id/deactivate` | Admin | Deactivate teacher account |
| PATCH | `/admin/teachers/:id/role` | Admin | Change user role (admin/teacher) |
| GET | `/admin/hubs` | Admin | List all hubs across all teachers |
| GET | `/admin/analytics/overview` | Admin | School-wide analytics summary |
| GET | `/admin/analytics/subjects` | Admin | Per-subject performance breakdown |
| GET | `/admin/analytics/at-risk` | Admin | All at-risk students across school |

> **Client:** React TS admin panel. Admin uses Better Auth session with `role: 'admin'`.
> Admin endpoints require `requireRole('admin')` middleware.

### Student Module (Teacher/Admin-managed)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/students` | Teacher/Admin (Session) | Create student profile |
| POST | `/students/batch` | Teacher/Admin (Session) | Bulk create students (CSV upload) |
| GET | `/students` | Teacher/Admin (Session) | List students (with filters) |
| GET | `/students/:id` | Teacher/Admin (Session) or Student (JWT) | Get student profile |
| PATCH | `/students/:id` | Teacher/Admin (Session) | Update student profile |
| PATCH | `/students/:id/reset-pin` | Teacher/Admin (Session) | Reset student PIN |
| PATCH | `/students/:id/avatar` | Student (JWT) | Update own avatar |
| DELETE | `/students/:id` | Teacher/Admin (Session) | Soft delete student |

### Hub Module

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/hubs` | Teacher/Admin (Session) | Create new hub |
| GET | `/hubs` | Teacher/Admin (Session) | List teacher's hubs (admin: all hubs) |
| GET | `/hubs/:id` | Teacher/Admin (Session) or Student (JWT) | Get hub details |
| PATCH | `/hubs/:id` | Teacher/Admin (Session) | Update hub settings |
| DELETE | `/hubs/:id` | Teacher/Admin (Session) | Soft delete hub |
| POST | `/hubs/:id/codes` | Teacher/Admin (Session) | Generate new server code |
| GET | `/hubs/:id/codes` | Teacher/Admin (Session) | List active codes |
| DELETE | `/hubs/:id/codes/:codeId` | Teacher/Admin (Session) | Revoke a code |
| POST | `/hubs/join` | Student (JWT) | Join hub with server code |
| GET | `/hubs/:id/members` | Teacher/Admin (Session) | List hub members |
| DELETE | `/hubs/:id/members/:studentId` | Teacher/Admin (Session) | Remove student from hub |

**Server Code Logic:**
- 6-character alphanumeric (uppercase, no ambiguous chars like 0/O, 1/I/L)
- Configurable expiration (default: 24 hours)
- Optional max uses (default: unlimited)
- Stored in Redis for fast lookup, backed by PostgreSQL

### Challenge Management Module (Teacher)

> **Teachers create all challenge content** through the dashboard. Worlds, zones, and topics are curriculum-defined (seeded), but the actual questions/tasks within each topic are authored by each teacher for their own hub.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/hubs/:hubId/challenges` | Teacher/Admin (Session) | List all challenges in hub (filterable by topic, type, difficulty) |
| GET | `/hubs/:hubId/topics/:topicId/challenges` | Teacher/Admin (Session) | List challenges for a specific topic in hub |
| POST | `/hubs/:hubId/topics/:topicId/challenges` | Teacher/Admin (Session) | Create a challenge for a topic |
| POST | `/hubs/:hubId/topics/:topicId/challenges/batch` | Teacher/Admin (Session) | Bulk create challenges (multiple at once) |
| GET | `/challenges/:id` | Teacher/Admin (Session) | Get single challenge details |
| PATCH | `/challenges/:id` | Teacher/Admin (Session) | Update challenge content |
| DELETE | `/challenges/:id` | Teacher/Admin (Session) | Soft delete challenge |
| POST | `/challenges/:id/duplicate` | Teacher/Admin (Session) | Duplicate a challenge (within same or different topic) |
| GET | `/hubs/:hubId/challenges/stats` | Teacher/Admin (Session) | Challenge coverage stats (topics with/without challenges) |

**Challenge creation notes:**
- Teacher selects topic → chooses challenge type → fills in question_data + correct_answer + difficulty + category
- `category` must be one of: `written_work`, `performance_task`, `quarterly_assessment` (DepEd grading components)
- Batch create supports JSON array of challenges (useful for importing or bulk authoring)
- Duplicate lets teachers reuse questions across topics or hubs with minor edits

### World & Challenge Module (Student)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/worlds` | Student (JWT) | List all worlds |
| GET | `/worlds/:slug` | Student (JWT) | Get world details + zones |
| GET | `/worlds/:slug/zones` | Student (JWT) | Get zones for grade + quarter |
| GET | `/zones/:id/topics` | Student (JWT) | Get topics in a zone |
| GET | `/topics/:id/challenges` | Student (JWT) | Get challenges (filtered by hub + adaptive difficulty) |
| POST | `/challenges/:id/submit` | Student (JWT) | Submit challenge answer |
| GET | `/challenges/:id/result` | Student (JWT) | Get attempt result |

**Challenge Delivery Flow:**
1. Student enters a zone → client requests topics for current week
2. Client requests challenges for a topic → server returns **challenges created by the student's hub teacher**, filtered by student's mastery level
3. Student submits answer → server validates server-side → returns result + points
4. Server updates competency_scores and student_progress
5. If enough competency reached → boss battle unlocks
6. Boss battle auto-selects the hardest challenges (difficulty 4-5) from each topic in the zone — no pre-marked boss challenges needed

### Progress Module

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/progress/me` | Student (JWT) | Get own progress across all hubs |
| GET | `/progress/me/hub/:hubId` | Student (JWT) | Progress in specific hub |
| GET | `/progress/me/world/:worldSlug` | Student (JWT) | Progress in specific world |
| GET | `/progress/students/:id` | Teacher/Admin (Session) | Get specific student's progress |
| GET | `/progress/hub/:hubId/overview` | Teacher/Admin (Session) | Hub-wide progress summary |

### Gamification Module

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/gamification/me/badges` | Student (JWT) | My earned badges |
| GET | `/gamification/me/streaks` | Student (JWT) | My streaks |
| GET | `/gamification/me/hero` | Student (JWT) | My hero power level breakdown |
| GET | `/gamification/leaderboard/:hubId` | Student (JWT) or Teacher/Admin (Session) | Hub leaderboard |
| GET | `/gamification/leaderboard/global` | Student (JWT) or Teacher/Admin (Session) | Global leaderboard (by grade) |
| GET | `/gamification/daily-challenge` | Student (JWT) | Today's daily challenge card |
| POST | `/gamification/daily-challenge/complete` | Student (JWT) | Mark daily challenge item done |

### Grading Module

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/grades/hub/:hubId` | Teacher/Admin (Session) | All students' grades in hub |
| GET | `/grades/hub/:hubId/student/:studentId` | Teacher/Admin (Session) | Specific student grades |
| GET | `/grades/me/hub/:hubId` | Student (JWT) | My grades in hub |
| POST | `/grades/hub/:hubId/compute` | Teacher/Admin (Session) | Trigger grade recomputation |
| GET | `/grades/hub/:hubId/export` | Teacher/Admin (Session) | Export grades as CSV |

### Dashboard Module (Teacher/Admin)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard/overview` | Teacher/Admin (Session) | Summary across all hubs |
| GET | `/dashboard/hub/:hubId` | Teacher/Admin (Session) | Hub-specific dashboard |
| GET | `/dashboard/hub/:hubId/at-risk` | Teacher/Admin (Session) | Students at risk of failing |
| GET | `/dashboard/hub/:hubId/competency` | Teacher/Admin (Session) | Competency breakdown |
| GET | `/dashboard/stream` | Teacher/Admin (SSE, Session) | Live dashboard event stream |

### Sync Module (Content Pack Only)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/sync/content-pack` | Student (JWT) | Download offline content bundle |

> **Offline mode is independent** — practice-only, no server sync. Offline attempts are stored locally on the device and never uploaded to the server. There is no sync upload endpoint or offline_sync_queue table.

### Analytics Module (MongoDB Atlas)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/analytics/events` | Student (JWT) | Log game event (challenge start/complete, zone complete, etc.) |
| POST | `/analytics/events/batch` | Student (JWT) | Batch log events (queued on client, sent in bursts) |
| POST | `/analytics/session/start` | Student (JWT) | Start player session tracking |
| POST | `/analytics/session/end` | Student (JWT) | End player session (computes duration) |
| GET | `/analytics/hub/:hubId/summary` | Teacher (Session) | Hub engagement summary (sessions, events, activity) |
| GET | `/analytics/hub/:hubId/students` | Teacher (Session) | Per-student activity breakdown |
| GET | `/analytics/admin/overview` | Admin (Session) | School-wide analytics overview |

> **Data stored in MongoDB Atlas.** Analytics are fire-and-forget — if MongoDB is temporarily unavailable, events are dropped silently. No game logic depends on analytics data. Server-side events (badge earned, grade computed) are logged automatically by their respective services.

---

## 2. WebSocket Events

Connection endpoint: `wss://host/ws`

Authentication:
- **Student (Unity):** Send JWT in first message after connection.
- **Teacher/Admin (React TS):** Send Better Auth session token via `bearer` plugin in first message.

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `auth` | `{ token: string }` | Authenticate WebSocket connection |
| `hub:join` | `{ hubId: string }` | Join hub room for live updates |
| `hub:leave` | `{ hubId: string }` | Leave hub room |
| `game:start` | `{ challengeId: string }` | Start a timed challenge |
| `game:answer` | `{ challengeId, answer }` | Submit answer in real-time mode |
| `game:boss:start` | `{ zoneId: string }` | Start boss battle |
| `game:boss:answer` | `{ challengeId, answer }` | Submit boss battle answer |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `auth:ok` | `{ userId }` | Authentication successful |
| `auth:error` | `{ message }` | Authentication failed |
| `hub:member_joined` | `{ student }` | New student joined hub |
| `hub:member_left` | `{ studentId }` | Student left hub |
| `game:challenge` | `{ challenge }` | Challenge data delivered |
| `game:result` | `{ correct, points, streak }` | Challenge result |
| `game:boss:phase` | `{ phase, challenge }` | Boss battle phase update |
| `game:boss:result` | `{ defeated, rewards }` | Boss battle outcome |
| `leaderboard:update` | `{ hubId, rankings }` | Leaderboard changed |
| `badge:earned` | `{ badge }` | Student earned a badge |
| `notification` | `{ type, message }` | System notification |

---

## 3. SSE Events (Teacher/Admin Dashboard)

Endpoint: `GET /api/v1/dashboard/stream`
Content-Type: `text/event-stream`
Auth: Better Auth session (cookie or bearer token)

| Event Name | Data | Description |
|------------|------|-------------|
| `student:progress` | `{ studentId, zoneId, completionPct }` | Student progress update |
| `student:online` | `{ hubId, studentId, status }` | Student came online/offline |
| `grade:updated` | `{ hubId, studentId, grade }` | Grade was recomputed |
| `alert:at-risk` | `{ studentId, reason }` | Student flagged as at-risk |
| `challenge:completed` | `{ studentId, challengeId, correct }` | Challenge attempt completed |
| `badge:awarded` | `{ studentId, badgeId }` | Badge was awarded |
| `hub:activity` | `{ hubId, activeCount }` | Hub activity summary |

---

## 4. Game World Design

### World Map

```
                 ┌─────────────────────┐
                 │  COMMAND FORTRESS    │
                 │  (Main Hub)          │
                 └────────┬────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────────┐ ┌──────────────┐ ┌──────────┐
│ LITERACY ISLAND │ │ SCIENCE      │ │ PE ARENA │
│ (English)       │ │ FRONTIER +   │ │ (PE)     │
│                 │ │ HEALTH CITY  │ │          │
│ Boss: Word      │ │ (Sci+Health) │ │ Boss:    │
│ Warden          │ │              │ │ Idle Rex │
│                 │ │ Bosses:      │ │          │
│ 4 zones (Q1-Q4)│ │ Contaminus + │ │ 4 zones  │
│ per grade level │ │ Junklord     │ │          │
└─────────────────┘ │              │ └──────────┘
                    │ 4 zones each │
                    └──────────────┘
                          │
                 (After all 3 worlds)
                          ▼
                 ┌─────────────────────┐
                 │  SHADOW COUNCIL     │
                 │  (Grand Final Boss) │
                 │  Cross-subject      │
                 │  assessment         │
                 └─────────────────────┘
```

### World → Zone → Topic → Challenge Hierarchy

- **World** = Subject (Literacy Island = English)
- **Zone** = Quarter (Forest of Words = English Q1 Grade 5)
- **Topic** = Weekly focus (Root Words and Prefixes = Week 1)
- **Challenge** = Individual question/task within a topic

Each zone has ~8 weeks of content. Weeks 6-7 are review/mastery. Week 8 is the milestone assessment (mini-boss or zone completion challenge).

### Boss Battle Design

**Unlock condition:** Complete ≥80% of zone challenges with ≥70% accuracy.

**Boss battle structure (auto-generated from teacher's challenges):**
1. Multi-phase encounter (3-5 phases)
2. System selects the hardest available challenges (difficulty 4-5) from different topics in the zone
3. Phases are ordered by increasing difficulty
4. Student must complete all phases to "defeat" the boss
5. Failed phases can be retried (limited attempts)
6. Boss defeat awards significant hero power points + special badge

> **No pre-marked boss challenges.** The server dynamically picks challenges at runtime when a student triggers a boss battle. This means teachers don't need to create separate "boss content" — they just create good challenges at various difficulty levels, and the system does the rest.

**Shadow Council (Final Boss):**
- Unlocks when ALL world bosses are defeated
- Cross-subject challenges: questions pull from all 3 subject hubs
- Represents quarterly assessment integration

### Adaptive Learning Engine

The adaptive engine adjusts challenge difficulty based on competency scores:

| Competency Score | Difficulty Level | Description |
|-----------------|-----------------|-------------|
| 0-30% | 1 (Beginner) | Foundational challenges, more hints |
| 31-50% | 2 (Developing) | Standard challenges |
| 51-70% | 3 (Proficient) | Moderate difficulty |
| 71-85% | 4 (Advanced) | Harder challenges, fewer hints |
| 86-100% | 5 (Mastery) | Expert-level, boss-eligible |

**Algorithm:**
1. On each challenge submission, update competency_score for the topic
2. Competency score = weighted average: recent attempts weigh more (exponential decay)
3. Next challenge selection prioritizes topics with lowest competency scores
4. Difficulty level = function of competency score (table above)
5. If student consistently gets correct → increase difficulty
6. If student struggles (3+ wrong in a row) → decrease difficulty, offer hint-enabled challenges

### Hero Power Level Calculation

Hero Power Level is an aggregate score across all activities:

| Activity | Points |
|----------|--------|
| Challenge correct (first try) | +10 × difficulty |
| Challenge correct (retry) | +5 × difficulty |
| Boss phase completed | +50 |
| Boss defeated | +200 |
| Badge earned | +25-100 (varies) |
| Daily challenge completed | +15 per item |
| Streak bonus (7 days) | +50 |
| Streak bonus (30 days) | +200 |
| Cross-world mission | +150 |

---

## 5. Offline Mode Design

### Core Principle
**Offline = Training Grounds.** Practice doesn't count toward official grades.

This eliminates:
- Cheating (can't manipulate offline answers for grade)
- Merge conflicts (no grade-affecting data to reconcile)
- Complex sync logic

### What Works Offline

| Feature | Offline | Notes |
|---------|---------|-------|
| Challenge practice | Yes | Same challenges, practice mode |
| Daily challenge view | Yes | Pre-cached content |
| Progress viewing | Yes | Cached from last sync |
| Avatar customization | Yes | Syncs on reconnect |
| Badge viewing | Yes | Cached |
| Challenge submission (graded) | No | Requires server validation |
| Boss battles | No | Real-time server-validated |
| Leaderboards | No | Real-time data |
| Hub interactions | No | Requires connection |

### Offline Content Pack

When student goes online, the client downloads a content pack:

| Content | Included | Size Estimate |
|---------|----------|---------------|
| Current zone challenges | All difficulties | ~500KB JSON |
| Next zone preview (week 1 only) | Basic | ~100KB |
| Daily challenges (next 3 days) | All items | ~50KB |
| Badge definitions | All | ~20KB |
| World/zone metadata | All | ~30KB |

**Total estimated:** ~700KB per sync (highly compressible)

### Sync Flow

1. **Going offline:** Client caches content pack + current progress state
2. **While offline:** Student practices challenges; attempts stored **locally on device only** as `offlinePracticeAttempts[]`
3. **Going online:** Client **does not upload** offline practice data to the server
4. **Offline data is independent:** Practice attempts stay on-device, never affect grades or server-side progress
5. **Client refreshes:** Downloads fresh content pack and latest progress from server

---

## 6. Anti-Cheat Measures

| Measure | Implementation |
|---------|---------------|
| **Server-side validation** | Answers validated on server, never trust client |
| **Time integrity** | Server tracks challenge start → submit time. Impossibly fast submissions rejected |
| **Active challenge lock** | Redis stores current active challenge per student. Can't submit for challenges they haven't started |
| **Attempt limiting** | Max 3 attempts per challenge per session. Cooldown after failure |
| **Offline isolation** | Offline practice never affects grades |
| **PIN rate limiting** | 5 login attempts per minute, auto-lockout after 10 failures |
| **Session management** | Single active session per student. New login invalidates old JWT session |

---

## 7. Notification Strategy

| Notification | Channel | Trigger |
|-------------|---------|---------|
| Daily challenge available | Push (if enabled) | Daily at 7 AM |
| Streak at risk | Push | 8 PM if no activity today |
| Boss battle unlocked | In-app | On qualification |
| Badge earned | In-app + WS | On achievement |
| Teacher announcement | In-app | Teacher/Admin sends |
| Grade published | In-app | Teacher/Admin triggers computation |
| At-risk alert (teacher/admin) | SSE + email | Auto-detected |
