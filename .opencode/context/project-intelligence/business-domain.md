<!-- Context: project-intelligence/business | Priority: critical | Version: 1.1 | Updated: 2026-04-04 -->

# Business Domain — NutriMind EDU

> Why this project exists, who it serves, and what success looks like.

## Project Identity

```
Project Name:      NutriMind EDU
Tagline:           Gamified adaptive learning for Filipino elementary students
School:            Tayug Central Elementary School
Problem Statement: Grade 5–6 students disengage from traditional drills in
                   English, Science, and PE+Health. No adaptive feedback exists.
Solution:          A gamified quiz server where students earn XP, badges, and
                   unlock worlds — teachers monitor progress via real-time dashboard.
```

## Target Users

| Segment | Who They Are | What They Need | Pain Points |
|---------|--------------|----------------|-------------|
| **Students** | Grade 5–6 pupils (age 10–12) | Fun, rewarding learning; PIN-based login (no email) | Bored by rote drills; no sense of progress |
| **Teachers** | Subject teachers (English, Science, PE+Health) | Class hub management; real-time progress visibility | No visibility into per-student weak areas |
| **Admin** | School administrator | Full oversight; teacher + student management | Manual tracking; no consolidated reporting |

## Subject Domains (Hubs)

| Hub | Subjects Covered | Worlds / Zones |
|-----|-----------------|----------------|
| English Hub | Reading, Grammar, Vocabulary | English World → zones by topic |
| Science Hub | Life Science, Physical, Earth | Science World → zones by topic |
| PE+Health Hub | Physical Ed, Health, Nutrition | PE+Health World → zones by topic |

## Gameplay Loop

```
Student logs in (PIN) → Enters subject Hub → Picks World → Picks Zone (topic)
→ Answers challenges (MCQ) → Earns XP + stars → Unlocks next zone
→ Boss battle at world end → Badge awarded → Leaderboard updated
```

## Value Proposition

**For Students**:
- Immediate feedback + XP rewards after every challenge
- Badges, streaks, and boss battles make learning feel like a game
- Heart system adds stakes; adaptive difficulty keeps it achievable

**For Teachers**:
- Real-time SSE dashboard: live student activity, zone completion rates
- Per-hub analytics: weakest topics, average scores, engagement stats
- Manage class hubs and assign students without IT involvement

**For Admin**:
- Full user management (create teachers, reset PINs, archive students)
- Cross-hub performance reports
- System-level controls

## Roles & Permissions

| Role | Auth Method | Key Capabilities |
|------|------------|-----------------|
| `student` | Custom JWT (PIN) | Play challenges, view own progress |
| `teacher` | Better Auth (cookie) | Manage hub members, view analytics |
| `admin` | Better Auth (cookie) | Full CRUD on all entities |

## Gamification System

| Mechanic | Description |
|----------|-------------|
| XP | Earned per correct answer; drives zone progression |
| Stars (1–3) | Per-challenge rating based on accuracy + speed |
| Hearts | Lives system; replenish over time |
| Streaks | Consecutive-day login bonus |
| Badges | Awarded for milestones (zone complete, boss defeated, etc.) |
| Leaderboard | Per-hub ranking updated after each session |
| Boss Battle | End-of-world challenge gate; higher difficulty |
| Adaptive Difficulty | Weak topic detection → more practice items served |

## Current Focus

- **Sprint**: Initial backend implementation (auth → hubs → challenges → progress → gamification)
- **Next Milestone**: Full feature parity with `.planning/03-execution-plan.md` sprint plan
- **Long-term**: Expand to more grade levels and subjects; mobile-first Unity client

## Business Constraints

- Students must use PIN only (no email/password) — school policy
- All data must stay within school-controlled environment (Aiven/Atlas cloud, not public SaaS)
- No real-money transactions — purely educational gamification
- Dual client (Unity + React) must share one API — no split backends

## 📂 Codebase References

- `src/features/student/` — Student entity, PIN auth, refresh tokens
- `src/features/hub/` — Class hub management, member enrollment
- `src/features/challenge/` — MCQ challenges, attempt tracking
- `src/features/progress/` — XP, stars, zone completion
- `src/features/gamification/` — Badges, streaks, leaderboard, boss battle
- `src/db/seed/` — Worlds, zones, topics, badges seed data

## Related Files

- `technical-domain.md` — How these needs are implemented technically
- `business-tech-bridge.md` — Business need → technical solution mapping
- `decisions-log.md` — Key product and architecture decisions
