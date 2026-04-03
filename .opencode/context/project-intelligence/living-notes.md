<!-- Context: project-intelligence/notes | Priority: high | Version: 1.1 | Updated: 2026-04-04 -->

# Living Notes — NutriMind Server

> Active constraints, gotchas, known issues, and open questions. Keep this alive.

## ⚠️ Critical Gotchas (Read Before Coding)

### 1. `src/db/schema.ts` Barrel — MANDATORY

Every new `{feature}.table.ts` file **must** be re-exported from `src/db/schema.ts`.
Without this, Drizzle cannot infer cross-feature relations and migrations will be incomplete.

```ts
// src/db/schema.ts — add every new table file here
export * from "@/features/student/student.table";
export * from "@/features/hub/hub.table";
// ...add yours here
```

### 2. Never Trust the Unity Client

All challenge answers are validated **server-side only**. The correct answer is never sent to Unity. If you're tempted to return the answer in the response for "UX reasons" — don't.

### 3. Student Auth ≠ Teacher Auth

These use completely different middleware:
- Student routes → `studentAuthMiddleware` (JWT Bearer)
- Teacher/Admin routes → `betterAuthMiddleware` (cookie) + `requireRole()`

Applying the wrong middleware silently allows/blocks the wrong user type.

### 4. Analytics Writes Are Fire-and-Forget

MongoDB Atlas writes (gameplay events) must be wrapped in `try/catch` and must **never** block the main HTTP response. If Atlas is unreachable, the student's game session must still succeed.

```ts
// ✅ Correct pattern
gameplayService.recordEvent(event).catch((err) => logger.error(err));
return c.json(successResponse(result));
```

### 5. BullMQ Jobs Need Redis

BullMQ uses Upstash Redis. If `UPSTASH_REDIS_URL` is missing or wrong, BullMQ workers will silently fail at startup. Check `src/index.ts` worker registration on boot.

---

## Known Technical Constraints

| Constraint | Origin | Impact |
|------------|--------|--------|
| All services remote | No local infra at school | `.env.local` required for all dev; no offline dev |
| PIN-only student auth | School policy | Cannot use OAuth, email, or passkeys for students |
| Single API, dual client | Budget/scope | One Hono server handles both Unity WS + React SSE |
| Bun runtime required | Architecture decision | Node.js commands (`node`, `npx`) may differ from `bunx` |

---

## Open Questions

| Question | Status | Next Action |
|----------|--------|-------------|
| What happens when a student runs out of hearts mid-boss? | Open | Define in gameplay design doc |
| Should leaderboard be per-hub or per-world? | Open | Confirm with teacher stakeholder |
| Should student PIN reset require teacher approval or admin-only? | Open | Confirm access control policy |
| Rate limit thresholds for challenge submit? | Open | Test with Unity client timing |

---

## Active Sprint

Based on `.planning/03-execution-plan.md`:

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | Project setup, config, DB schema, migrations | In Progress |
| 2 | Auth (Better Auth + Custom JWT), student CRUD | Pending |
| 3 | Hub management, challenge seeding | Pending |
| 4 | Challenge play loop, scoring, anti-cheat | Pending |
| 5 | Gamification (XP, badges, streaks, leaderboard) | Pending |
| 6 | Adaptive learning, analytics pipeline | Pending |
| 7 | WebSocket (boss battle), SSE (teacher dashboard) | Pending |
| 8 | Testing, hardening, seed data | Pending |

---

## Patterns Worth Preserving

- **Colocated tests**: `{feature}.test.ts` lives next to the feature, not in a top-level `tests/` folder
- **Typed errors only**: Always use `AppError`, `NotFoundError`, `ValidationError`, `AuthError` — never `throw new Error(...)`
- **Response helpers**: Always use `src/shared/lib/response.ts` — never hand-craft JSON
- **`@/` imports**: Always use the path alias — never relative `../../` imports

## Gotchas for Maintainers

- `biome.json` controls all formatting — don't add `.eslintrc` or `.prettierrc`
- `drizzle-kit generate` does NOT apply the migration — always run `drizzle-kit migrate` after
- Student `studentId` is a school-assigned string (e.g. `"2024-0001"`), not a UUID
- Better Auth user IDs are `varchar(36)` — foreign keys referencing them must match this type
- Soft delete preferred (`deleted_at`) over hard delete for students and hubs (audit trail)

---

## 📂 Codebase References

- `src/db/schema.ts` — Barrel (add new tables here or Drizzle breaks)
- `src/shared/lib/errors.ts` — All custom error classes
- `src/shared/lib/response.ts` — Standardized response helpers
- `src/shared/middleware/student-auth.ts` — JWT middleware (students only)
- `src/index.ts` — BullMQ worker registration
- `.planning/03-execution-plan.md` — Full sprint breakdown

## Related Files

- `decisions-log.md` — Why these patterns exist
- `technical-domain.md` — Full technical context
- `business-domain.md` — Business constraints driving these rules
