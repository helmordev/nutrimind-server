<!-- Context: project-intelligence/nav | Priority: critical | Version: 1.1 | Updated: 2026-04-04 -->

# Project Intelligence — NutriMind EDU

> Start here. These files capture everything an agent or developer needs to understand the project.

## Structure

```
.opencode/context/project-intelligence/
├── navigation.md              # This file — start here
├── business-domain.md         # What, why, who — NutriMind EDU context
├── technical-domain.md        # Stack, architecture, project structure, dev setup
├── business-tech-bridge.md    # How business needs map to technical solutions
├── decisions-log.md           # Key architectural decisions with rationale
└── living-notes.md            # ⚠️ Gotchas, constraints, open questions, active sprint
```

## Quick Routes

| What You Need | File | Description |
|---------------|------|-------------|
| Project purpose + users | `business-domain.md` | NutriMind EDU, Grade 5-6 students, gamification loop |
| Tech stack + architecture | `technical-domain.md` | Bun/Hono/Drizzle/PostgreSQL/Redis/MongoDB, feature structure |
| Why each tech was chosen | `decisions-log.md` | Dual auth, Bun, MongoDB for analytics, Biome, feature-based |
| Business → tech mapping | `business-tech-bridge.md` | JWT for Unity, SSE for dashboard, BullMQ for XP jobs |
| ⚠️ Before writing any code | `living-notes.md` | Schema barrel gotcha, anti-cheat rules, active sprint |

## Agent / Developer Onboarding Order

1. `navigation.md` (this file) — orient yourself
2. `business-domain.md` — understand the "why"
3. `technical-domain.md` — understand the "how"
4. `living-notes.md` — read the gotchas **before touching code**
5. `decisions-log.md` — understand key decisions when context is needed
6. `business-tech-bridge.md` — when you need to explain or change a mapping

## Project Snapshot

```
Project:   NutriMind EDU
School:    Tayug Central Elementary School
Clients:   Unity (students) + React TS (teachers/admin)
Stack:     Bun · Hono · Drizzle · PostgreSQL · Redis · MongoDB
Auth:      Better Auth (teacher/admin) + Custom JWT (student PIN)
Routes:    /api/v1/* (REST) | /api/auth/* (Better Auth) | WS + SSE
```

## Integration

This folder is referenced from:
- `.opencode/context/core/navigation.md` — top-level context index
- `.opencode/context/core/standards/` — code, docs, test standards
- `AGENTS.md` — project-level agent guidelines

See `.opencode/context/core/` for standards, workflows, and the broader context system.

## Maintenance

- **Update `living-notes.md`** whenever a new gotcha or constraint is discovered
- **Update `decisions-log.md`** when a major architectural choice is made
- **Bump version + date** in frontmatter on every meaningful update
- **Do not** add project-specific code standards here — those live in `.opencode/context/core/standards/`
