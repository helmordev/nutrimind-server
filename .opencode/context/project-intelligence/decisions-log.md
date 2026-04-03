<!-- Context: project-intelligence/decisions | Priority: high | Version: 1.1 | Updated: 2026-04-04 -->

# Decisions Log — NutriMind Server

> Major architectural decisions with rationale. Prevents "why was this done?" debates.

---

## Decision: Dual Authentication Strategy

**Date**: 2026-04-04  
**Status**: Decided  
**Owner**: Backend Lead

### Context
Two fundamentally different clients: a Unity game (students, PIN-only) and a React web panel (teachers/admin, email+password). Single auth system cannot serve both cleanly.

### Decision
- **Students**: Custom JWT (Student ID + 6-digit PIN → access token + refresh token stored in PostgreSQL)
- **Teachers/Admin**: Better Auth with Drizzle adapter (email+password, cookie sessions, admin plugin)

### Rationale
Unity C# HTTP clients cannot manage cookies reliably. JWT in `Authorization: Bearer` header is the only practical approach. Better Auth handles teacher session complexity (refresh, revoke, future 2FA) without custom code.

### Alternatives Considered
| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Better Auth for all | Single auth system | Unity can't use cookies; PIN login not supported | Unity compatibility fails |
| Custom JWT for all | Uniform approach | Rebuilds all of Better Auth's session management | Too much undifferentiated work |

### Impact
- **Positive**: Each client gets auth optimized for its constraints
- **Negative**: Two middleware stacks to maintain (`student-auth.ts` + Better Auth)
- **Risk**: Keeping JWT secret and Better Auth secret both secure in env

---

## Decision: Bun Runtime over Node.js

**Date**: 2026-04-04  
**Status**: Decided  
**Owner**: Backend Lead

### Context
Need a fast TypeScript runtime with built-in test runner, no transpile step, and native `Bun.password` for PIN hashing.

### Decision
Use Bun as the runtime (`bun run dev`, `bun test`, `Bun.password` for bcrypt).

### Rationale
Bun eliminates the need for `ts-node`, `tsx`, or `ts-jest`. `Bun.password` provides bcrypt hashing without an extra `bcrypt` dependency. Startup time and test speed are significantly faster than Node + Jest.

### Alternatives Considered
| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Node.js + tsx | Mature ecosystem | Slower tests; extra deps for TS + bcrypt | Slower dev loop |
| Deno | Built-in TS | Different module system; ecosystem gaps | Team unfamiliar |

### Impact
- **Positive**: Fast `bun test`, no transpile config, built-in bcrypt
- **Negative**: Bun-specific APIs (not 100% Node-compatible)
- **Risk**: Edge Bun versions may break periodically; pin version in CI

---

## Decision: MongoDB Atlas for Analytics (not PostgreSQL)

**Date**: 2026-04-04  
**Status**: Decided  
**Owner**: Backend Lead

### Context
Gameplay events (every challenge attempt, adaptive signals) are high-volume and evolve in shape over time. SQL schema migrations for this are too rigid.

### Decision
Write all gameplay analytics events to MongoDB Atlas. Use PostgreSQL only for structured relational data (students, hubs, challenges, progress aggregates).

### Rationale
Event documents vary in structure as game mechanics evolve. MongoDB's flexible schema means no migration needed when a new event type is added. The adaptive learning engine reads from MongoDB; PostgreSQL stays clean.

### Alternatives Considered
| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| PostgreSQL JSONB columns | Single DB | Schema discipline degrades over time | Too easy to abuse |
| TimescaleDB | Purpose-built for events | Extra infra, unfamiliar | Over-engineering |

### Impact
- **Positive**: Flexible analytics schema; adaptive engine has rich data
- **Negative**: Two databases to manage; analytics queries can't JOIN with PG
- **Risk**: MongoDB connection pooling must be managed carefully in serverless-like Bun

---

## Decision: Feature-Based Modular Structure

**Date**: 2026-04-04  
**Status**: Decided  
**Owner**: Backend Lead

### Context
Project has 8+ domains (auth, student, hub, challenge, progress, gamification, analytics, admin). Flat file organization would become unmanageable.

### Decision
Each domain is a self-contained folder under `src/features/{feature}/` owning its own table, routes, service, schema, types, and tests.

### Rationale
Self-contained features can be developed, tested, and reviewed independently. New developers understand the boundary immediately. Colocated tests reduce the chance of orphaned test files.

### Impact
- **Positive**: Clear ownership; easy to add/remove features; colocated tests
- **Negative**: Cross-feature queries require importing from sibling features
- **Risk**: `src/db/schema.ts` barrel must be kept in sync (see living-notes.md)

---

## Decision: Biome over ESLint + Prettier

**Date**: 2026-04-04  
**Status**: Decided  
**Owner**: Backend Lead

### Context
Need a single tool for linting AND formatting. ESLint + Prettier have config conflicts and slow CI.

### Decision
Use Biome exclusively. `bun run check` runs `biome check --write .` for both lint and format in one pass.

### Rationale
Biome is ~100x faster than ESLint in benchmarks. Single config file (`biome.json`). No ESLint/Prettier version conflicts. CI rejects unformatted code.

### Impact
- **Positive**: Fast, unified toolchain; no config wars
- **Negative**: Biome rule set differs slightly from ESLint — some rules don't exist yet
- **Risk**: Biome is newer; some edge cases may need workarounds

---

## 📂 Codebase References

- `src/shared/middleware/student-auth.ts` — Student JWT implementation
- `src/config/auth.ts` — Better Auth configuration
- `src/config/mongodb.ts` — MongoDB Atlas connection
- `src/db/schema.ts` — Drizzle barrel (feature-based table re-exports)
- `biome.json` — Biome linter/formatter config

## Related Files

- `technical-domain.md` — Current stack reflecting these decisions
- `business-tech-bridge.md` — Business rationale behind technical choices
- `living-notes.md` — Known issues arising from these decisions
