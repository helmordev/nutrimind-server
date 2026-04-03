# NutriMind Server — Database Schema Design

**Generated**: 2026-04-03
**Database**: PostgreSQL on Aiven (via Drizzle ORM)
**Analytics DB**: MongoDB Atlas (game events, telemetry, session logs)
**Cache**: Redis (Upstash)

---

## 1. Schema Overview

The database is organized into **6 domains**:

1. **Auth** — Better Auth tables (teacher/admin users, sessions), custom student auth
2. **Hubs** — Classrooms with join codes
3. **Worlds** — Game worlds, zones, challenges (curriculum content)
4. **Progress** — Student progress through worlds and challenges
5. **Gamification** — Badges, hero levels, streaks, daily challenges
6. **Grading** — DepEd-aligned grade computation

> **Dual auth strategy:** Teacher/admin users are managed by **Better Auth** (email + password, cookie sessions, admin plugin). Students use **custom JWT** (student ID + PIN). The two auth systems share no tables.

---

## 2. Auth Domain

### 2a. Better Auth Tables (Teacher/Admin)

Better Auth manages these tables via its Drizzle adapter. Core columns are controlled by Better Auth; we extend `user` with additional fields.

#### user (Better Auth managed)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar(36) | PK | Better Auth generated ID |
| name | varchar(255) | NOT NULL | Display name |
| email | varchar(255) | UNIQUE, NOT NULL | Login email |
| email_verified | boolean | DEFAULT false | Email verification status |
| image | varchar(255) | NULLABLE | Profile image URL |
| created_at | timestamp | DEFAULT now() | |
| updated_at | timestamp | DEFAULT now() | |
| **role** | varchar(20) | DEFAULT 'teacher' | 'admin' or 'teacher' (Better Auth admin plugin) |
| **first_name** | varchar(100) | NOT NULL | Additional field |
| **last_name** | varchar(100) | NOT NULL | Additional field |
| **school** | varchar(255) | DEFAULT 'Tayug Central Elementary School' | Additional field |
| **is_active** | boolean | DEFAULT true | Soft deactivation |

> **Bold columns** are our additional fields added via Better Auth `user.additionalFields` config. Better Auth's admin plugin manages the `role` field.

#### session (Better Auth managed)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar(36) | PK | |
| user_id | varchar(36) | FK → user.id, NOT NULL | |
| token | varchar(255) | UNIQUE, NOT NULL | Session token |
| expires_at | timestamp | NOT NULL | Session expiry |
| ip_address | varchar(45) | NULLABLE | Client IP |
| user_agent | text | NULLABLE | Browser/client info |
| created_at | timestamp | DEFAULT now() | |
| updated_at | timestamp | DEFAULT now() | |

> Sessions are stored in Redis via `secondaryStorage` for performance, with database as fallback.

#### account (Better Auth managed)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar(36) | PK | |
| user_id | varchar(36) | FK → user.id, NOT NULL | |
| account_id | varchar(255) | NOT NULL | Provider-specific account ID |
| provider_id | varchar(255) | NOT NULL | 'credential' for email/password |
| access_token | text | NULLABLE | OAuth access token (if applicable) |
| refresh_token | text | NULLABLE | OAuth refresh token (if applicable) |
| expires_at | timestamp | NULLABLE | Token expiry |
| password | varchar(255) | NULLABLE | Hashed password (for credential provider) |
| created_at | timestamp | DEFAULT now() | |
| updated_at | timestamp | DEFAULT now() | |

#### verification (Better Auth managed)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar(36) | PK | |
| identifier | varchar(255) | NOT NULL | Email address |
| value | varchar(255) | NOT NULL | Verification token |
| expires_at | timestamp | NOT NULL | Token expiry |
| created_at | timestamp | DEFAULT now() | |
| updated_at | timestamp | DEFAULT now() | |

### 2b. Custom Auth Tables (Student)

#### students

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen | Student unique ID |
| student_id_number | varchar(50) | UNIQUE, NOT NULL | School student ID (login credential) |
| pin_hash | varchar(255) | NOT NULL | 4-6 digit PIN, bcrypt hashed |
| first_name | varchar(100) | NOT NULL | |
| last_name | varchar(100) | NOT NULL | |
| grade_level | smallint | NOT NULL, CHECK (5 or 6) | Grade 5 or 6 |
| section | varchar(50) | | Class section |
| avatar_data | jsonb | DEFAULT '{}' | Hero avatar customization JSON |
| hero_power_level | integer | DEFAULT 0 | Aggregate power level |
| created_by | varchar(36) | FK → user.id | Teacher/admin who registered this student |
| is_active | boolean | DEFAULT true | |
| failed_login_attempts | smallint | DEFAULT 0 | Auto-lockout after 10 |
| locked_until | timestamp | NULLABLE | Lockout expiry |
| created_at | timestamp | DEFAULT now() | |
| updated_at | timestamp | DEFAULT now() | |

#### student_refresh_tokens

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| student_id | uuid | FK → students.id, NOT NULL | Student reference |
| token_hash | varchar(255) | UNIQUE, NOT NULL | Hashed refresh token |
| expires_at | timestamp | NOT NULL | Token expiry |
| created_at | timestamp | DEFAULT now() | |

---

## 3. Hubs Domain

### hubs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| teacher_id | varchar(36) | FK → user.id, NOT NULL | Hub owner (teacher or admin) |
| name | varchar(255) | NOT NULL | Hub display name (e.g., "Grade 5 - Section A") |
| description | text | | |
| subject | varchar(20) | NOT NULL | 'english', 'science', 'pe_health' |
| grade_level | smallint | NOT NULL | 5 or 6 |
| quarter | smallint | NOT NULL, CHECK (1-4) | Current active quarter |
| is_active | boolean | DEFAULT true | |
| created_at | timestamp | DEFAULT now() | |
| updated_at | timestamp | DEFAULT now() | |
| UNIQUE | | (teacher_id, subject, grade_level) | One hub per subject per grade per teacher |

### server_codes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| hub_id | uuid | FK → hubs.id, NOT NULL | Which hub this code joins |
| code | varchar(6) | UNIQUE, NOT NULL | 6-char alphanumeric join code |
| max_uses | integer | NULLABLE | NULL = unlimited |
| use_count | integer | DEFAULT 0 | Current usage count |
| expires_at | timestamp | NOT NULL | Code expiration |
| created_by | varchar(36) | FK → user.id | |
| created_at | timestamp | DEFAULT now() | |

### hub_members

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| hub_id | uuid | FK → hubs.id, NOT NULL | |
| student_id | uuid | FK → students.id, NOT NULL | |
| joined_at | timestamp | DEFAULT now() | |
| is_active | boolean | DEFAULT true | Soft removal |
| UNIQUE | | (hub_id, student_id) | No duplicate membership |

---

## 4. Worlds Domain (Curriculum Content)

### worlds

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| name | varchar(255) | NOT NULL | e.g., "Literacy Island", "Science Frontier" |
| slug | varchar(50) | UNIQUE, NOT NULL | URL-safe identifier |
| subject | varchar(20) | NOT NULL | 'english', 'science', 'pe_health' |
| description | text | | World narrative description |
| boss_name | varchar(100) | | World boss name (e.g., "Word Warden") |
| boss_description | text | | Boss narrative |
| order_index | smallint | NOT NULL | Display order |

### zones

A zone represents a quarter's content within a world.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| world_id | uuid | FK → worlds.id | |
| grade_level | smallint | NOT NULL | 5 or 6 |
| quarter | smallint | NOT NULL, CHECK (1-4) | |
| name | varchar(255) | NOT NULL | e.g., "Forest of Words" |
| description | text | | Zone narrative |
| week_start | smallint | DEFAULT 1 | |
| week_end | smallint | DEFAULT 8 | |
| order_index | smallint | | |
| UNIQUE | | (world_id, grade_level, quarter) | |

### topics

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| zone_id | uuid | FK → zones.id | |
| name | varchar(255) | NOT NULL | e.g., "Root Words and Prefixes" |
| week_number | smallint | NOT NULL | Which week in the quarter |
| matatag_competency | text | | DepEd competency code |
| description | text | | |
| order_index | smallint | | |

### challenges

> **Teacher-created content.** Teachers create challenge questions per hub through the dashboard. Worlds, zones, and topics are seeded (curriculum structure), but challenges are authored by each teacher for their own hub. Boss battles are auto-generated at runtime by selecting the hardest challenges from each topic in the zone.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| hub_id | uuid | FK → hubs.id, NOT NULL | Scoped to a specific hub (teacher's classroom) |
| topic_id | uuid | FK → topics.id | |
| created_by | varchar(36) | FK → user.id, NOT NULL | Teacher who created this challenge |
| type | varchar(30) | NOT NULL | See challenge types below |
| difficulty | smallint | NOT NULL, CHECK (1-5) | 1=easy, 5=hardest |
| category | varchar(20) | NOT NULL | 'written_work', 'performance_task', 'quarterly_assessment' |
| question_data | jsonb | NOT NULL | Question content (flexible per type) |
| correct_answer | jsonb | NOT NULL | Expected answer(s) |
| points | integer | NOT NULL | Points awarded |
| time_limit_seconds | integer | NULLABLE | Optional time limit |
| is_active | boolean | DEFAULT true | |
| created_at | timestamp | DEFAULT now() | |
| updated_at | timestamp | DEFAULT now() | |

**Challenge types:**
- `multiple_choice` — 4 options, 1 correct
- `fill_in_blank` — Text input
- `matching` — Match pairs
- `ordering` — Arrange items in sequence
- `true_false` — Binary choice
- `drag_drop` — Drag items to categories
- `oral_fluency` — Speech recognition (English)
- `physical_task` — PE movement-based (verified by timer/self-report)
- `scenario` — Story/situation-based multi-step

---

## 5. Progress Domain

### student_progress

Tracks overall progress per student per zone (quarter of a world).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| student_id | uuid | FK → students.id | |
| zone_id | uuid | FK → zones.id | |
| hub_id | uuid | FK → hubs.id | Which hub context |
| current_topic_id | uuid | FK → topics.id, NULLABLE | Current active topic |
| completion_pct | decimal(5,2) | DEFAULT 0 | 0.00 to 100.00 |
| mastery_level | smallint | DEFAULT 1 | 1-5 (adaptive difficulty) |
| boss_unlocked | boolean | DEFAULT false | Boss battle available |
| boss_defeated | boolean | DEFAULT false | Boss battle completed |
| started_at | timestamp | DEFAULT now() | |
| completed_at | timestamp | NULLABLE | |
| UNIQUE | | (student_id, zone_id, hub_id) | |

### challenge_attempts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| student_id | uuid | FK → students.id | |
| challenge_id | uuid | FK → challenges.id | |
| hub_id | uuid | FK → hubs.id | |
| answer_data | jsonb | NOT NULL | Student's submitted answer |
| is_correct | boolean | NOT NULL | Server-validated result |
| points_earned | integer | NOT NULL | |
| time_spent_seconds | integer | | How long it took |
| attempt_number | smallint | NOT NULL | Which attempt (for retry logic) |
| difficulty_at_time | smallint | | Adaptive difficulty when attempted |
| created_at | timestamp | DEFAULT now() | |

**Index:** (student_id, challenge_id, hub_id) for quick lookups.

### competency_scores

Tracks per-competency mastery for adaptive learning.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| student_id | uuid | FK → students.id | |
| topic_id | uuid | FK → topics.id | |
| hub_id | uuid | FK → hubs.id | |
| score | decimal(5,2) | DEFAULT 0 | Competency score (0-100) |
| attempts_count | integer | DEFAULT 0 | Total attempts on this competency |
| correct_count | integer | DEFAULT 0 | Correct attempts |
| last_attempted_at | timestamp | | |
| UNIQUE | | (student_id, topic_id, hub_id) | |

---

## 6. Gamification Domain

### badges

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| name | varchar(100) | NOT NULL | e.g., "Word Wizard" |
| slug | varchar(50) | UNIQUE | |
| description | text | | |
| icon_key | varchar(50) | | Asset reference for badge icon |
| category | varchar(30) | | 'achievement', 'streak', 'mastery', 'cross_world' |
| criteria | jsonb | NOT NULL | Criteria to earn (flexible JSON) |
| points_value | integer | DEFAULT 0 | Hero power points |

### student_badges

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| student_id | uuid | FK → students.id | |
| badge_id | uuid | FK → badges.id | |
| earned_at | timestamp | DEFAULT now() | |
| UNIQUE | | (student_id, badge_id) | One badge per student |

### streaks

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| student_id | uuid | FK → students.id | |
| hub_id | uuid | FK → hubs.id | |
| current_streak | integer | DEFAULT 0 | Consecutive days active |
| longest_streak | integer | DEFAULT 0 | All-time record |
| last_activity_date | date | | Date of last qualifying activity |
| UNIQUE | | (student_id, hub_id) | |

### daily_challenges

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| date | date | NOT NULL | Challenge date |
| grade_level | smallint | NOT NULL | 5 or 6 |
| word_of_day | jsonb | | English: word, definition, usage |
| health_fact | jsonb | | Health fact content |
| science_discovery | jsonb | | Science fact content |
| pe_move | jsonb | | PE movement challenge |
| created_at | timestamp | DEFAULT now() | |
| UNIQUE | | (date, grade_level) | One per day per grade |

### daily_challenge_completions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| student_id | uuid | FK → students.id | |
| daily_challenge_id | uuid | FK → daily_challenges.id | |
| completed_items | jsonb | DEFAULT '[]' | Which items completed |
| completed_at | timestamp | DEFAULT now() | |
| UNIQUE | | (student_id, daily_challenge_id) | |

---

## 7. Grading Domain

### grades

DepEd grading: Written Work 25%, Performance Task 50%, Quarterly Assessment 25%.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| student_id | uuid | FK → students.id | |
| hub_id | uuid | FK → hubs.id | |
| quarter | smallint | NOT NULL | 1-4 |
| written_work_score | decimal(5,2) | DEFAULT 0 | Raw score (0-100) |
| performance_task_score | decimal(5,2) | DEFAULT 0 | Raw score (0-100) |
| quarterly_assessment_score | decimal(5,2) | DEFAULT 0 | Raw score (0-100) |
| weighted_score | decimal(5,2) | | Computed: WW×0.25 + PT×0.50 + QA×0.25 |
| transmuted_grade | smallint | | DepEd transmutation (75-100 scale) |
| remarks | varchar(20) | | 'Outstanding', 'Very Satisfactory', etc. |
| computed_at | timestamp | | Last computation timestamp |
| UNIQUE | | (student_id, hub_id, quarter) | |

**DepEd Transmutation:**
- 100 → 100 (Outstanding)
- 90-99 → mapped to DepEd scale
- 75 = passing minimum
- Below 75 → failing

---

## 8. Redis Data Structures (Upstash)

Redis (Upstash) handles ephemeral, high-frequency, and real-time data:

| Key Pattern | Type | TTL | Purpose |
|-------------|------|-----|---------|
| `better-auth:session:{token}` | String (JSON) | 7d | Better Auth teacher/admin sessions (secondaryStorage) |
| `student:refresh:{tokenHash}` | String | 7d | Student refresh token validation |
| `rate:{ip}:{endpoint}` | String (counter) | 60s | Rate limiting |
| `leaderboard:{hubId}` | Sorted Set | ∞ | Real-time hub leaderboard (score → studentId) |
| `leaderboard:global:{gradeLevel}` | Sorted Set | ∞ | Global leaderboard |
| `online:{hubId}` | Set | ∞ | Currently online students in hub |
| `challenge:active:{studentId}` | String (JSON) | 30m | Current active challenge (anti-cheat) |
| `daily:{date}:{gradeLevel}` | String (JSON) | 24h | Cached daily challenge card |
| `hub:code:{code}` | String (hubId) | configurable | Server code → hub lookup |

---

## 9. MongoDB Atlas Collections (Analytics & Telemetry)

MongoDB Atlas stores non-relational, high-write analytics data. This data is append-heavy and does not require foreign-key integrity with PostgreSQL.

### game_events

Captures all significant in-game actions for analytics and reporting.

| Field | Type | Description |
|-------|------|-------------|
| _id | ObjectId | Auto-generated |
| event_type | string | `challenge_started`, `challenge_completed`, `boss_battle_started`, `boss_battle_completed`, `zone_completed`, `badge_earned`, `streak_updated`, `daily_challenge_completed` |
| student_id | string | Reference to students.id (UUID string) |
| hub_id | string | Reference to hubs.id (UUID string) |
| payload | object | Event-specific data (flexible schema per event_type) |
| metadata | object | `{ client: 'unity', version: '1.0', platform: 'android' }` |
| created_at | Date | Event timestamp |

**Indexes:** `{ event_type: 1, created_at: -1 }`, `{ student_id: 1, created_at: -1 }`, `{ hub_id: 1, event_type: 1 }`

### player_sessions

Tracks game session duration and activity for engagement metrics.

| Field | Type | Description |
|-------|------|-------------|
| _id | ObjectId | Auto-generated |
| student_id | string | Reference to students.id |
| hub_id | string | Reference to hubs.id |
| started_at | Date | Session start |
| ended_at | Date | Session end (null if active) |
| duration_seconds | number | Computed on session end |
| challenges_attempted | number | Count of challenges tried |
| challenges_correct | number | Count of correct answers |
| zones_visited | string[] | Zone IDs visited during session |
| client_info | object | `{ platform, version, device }` |

**Indexes:** `{ student_id: 1, started_at: -1 }`, `{ hub_id: 1, started_at: -1 }`

### teacher_activity_logs

Tracks teacher dashboard actions for audit trail.

| Field | Type | Description |
|-------|------|-------------|
| _id | ObjectId | Auto-generated |
| teacher_id | string | Reference to user.id |
| action | string | `challenge_created`, `challenge_updated`, `student_created`, `grade_exported`, `hub_created` |
| resource_type | string | `challenge`, `student`, `hub`, `grade` |
| resource_id | string | ID of the affected resource |
| details | object | Action-specific data |
| created_at | Date | Action timestamp |

**Indexes:** `{ teacher_id: 1, created_at: -1 }`, `{ action: 1, created_at: -1 }`

> **Data separation:** PostgreSQL is the source of truth for all relational game data. MongoDB stores analytics/telemetry only — no game logic depends on MongoDB. If MongoDB is temporarily unavailable, the game continues to work; analytics events are simply dropped.

---

## 10. Key Indexes

| Table | Index | Columns | Reason |
|-------|-------|---------|--------|
| user | idx_user_email | email | Better Auth login lookup |
| user | idx_user_role | role | Admin/teacher filtering |
| students | idx_students_student_id | student_id_number | Student login lookup |
| students | idx_students_created_by | created_by | Teacher's students |
| hub_members | idx_hub_members_student | student_id | Student's hubs |
| hub_members | idx_hub_members_hub | hub_id | Hub roster |
| challenges | idx_challenges_hub_topic | (hub_id, topic_id) | Challenges by hub + topic |
| challenges | idx_challenges_difficulty | (hub_id, topic_id, difficulty) | Adaptive query within hub |
| challenges | idx_challenges_created_by | created_by | Teacher's challenges |
| challenge_attempts | idx_attempts_student_hub | (student_id, hub_id) | Student history |
| student_progress | idx_progress_student | student_id | Progress overview |
| grades | idx_grades_hub_quarter | (hub_id, quarter) | Teacher grade view |
| competency_scores | idx_competency_student | (student_id, hub_id) | Adaptive engine |

---

## 11. Entity Relationships Summary

```
user (Better Auth) ──1:N──▶ hubs
user (Better Auth) ──1:N──▶ students (created_by)
user (Better Auth) ──1:N──▶ session (Better Auth)
user (Better Auth) ──1:N──▶ account (Better Auth)
hubs ──1:N──▶ server_codes
hubs ──1:N──▶ hub_members
hubs ──1:N──▶ challenges (teacher-created per hub)
user (Better Auth) ──1:N──▶ challenges (created_by)
students ──1:N──▶ hub_members
students ──1:N──▶ student_refresh_tokens
worlds ──1:N──▶ zones
zones ──1:N──▶ topics
topics ──1:N──▶ challenges
students ──1:N──▶ student_progress
students ──1:N──▶ challenge_attempts
students ──1:N──▶ student_badges
students ──1:N──▶ grades
students ──1:N──▶ streaks
students ──1:N──▶ competency_scores
```
