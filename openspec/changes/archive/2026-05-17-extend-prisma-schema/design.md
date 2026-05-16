## Context

The current `schema.prisma` (packages/db) contains five models: `User`, `OtpToken`, `RefreshToken`, `Workshop`, and `Registration`. Upcoming features — admin student import, in-app notification delivery, and time-gated workshop registration — require schema additions. All changes must be additive and non-breaking.

## Goals / Non-Goals

**Goals:**
- Add `registrationOpenAt` / `registrationCloseAt` nullable columns to `workshops`.
- Add `CANCELLED` to the `RegStatus` enum without altering existing values.
- Introduce `Notification`, `StudentRecord`, and `ImportLog` models with correct indexes and relations.
- Generate a migration SQL file that applies cleanly against a Neon PostgreSQL instance.
- Export the three new Prisma model types from `packages/db/src/index.ts`.

**Non-Goals:**
- No changes to app code (API routes, workers, web components).
- No seeding or data backfill — new columns are nullable or have safe defaults.
- No enum-to-model promotion for `RegStatus` or `WorkshopStatus`.
- No multi-tenant scoping on `StudentRecord` (single institution assumed for MVP).

## Decisions

### 1 — Use plain `String` for `Notification.type`, `StudentRecord.status`, `ImportLog.status`

Prisma enums require a migration for each new value; string columns let the application evolve these states without schema churn. The set of valid values is enforced at the application layer.

**Alternative considered:** Prisma enums — rejected because adding values during demos or rapid iteration triggers a migration each time.

### 2 — No foreign key from `StudentRecord` to `User`

`StudentRecord` is the pre-registration import roster; a student may not yet have a `User` account. Linking via email at registration time keeps the models decoupled and avoids nullable FK gymnastics.

**Alternative considered:** `userId String? @db.Uuid` FK on `StudentRecord` — rejected as premature for MVP; matching can be done at the service layer.

### 3 — `ImportLog` has no FK to a parent entity

Import batches are system-level operations, not scoped to a workshop or user. A `filename` string plus timestamps is sufficient for audit purposes.

### 4 — Migration generated via `prisma migrate dev --name extend-schema`

`migrate dev` produces a timestamped SQL file in `packages/db/prisma/migrations/`, which is the project's established pattern. The SQL is committed alongside the schema change.

**Critical flows:**

```
1. Developer runs: pnpm --filter @unihub/db migrate:dev
   → Prisma diffs schema, generates SQL migration
   → Applies migration to local/Neon dev database
   → Regenerates Prisma Client

2. CI/Production: pnpm --filter @unihub/db migrate:deploy
   → Applies pending migrations (non-interactive, safe for prod)
```

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| `CANCELLED` enum value added after data exists in prod | Additive enum changes are safe in PostgreSQL; no existing rows carry this value yet |
| `Notification` table grows unbounded | Out of scope for this change; a cleanup job can be added later |
| `StudentRecord.email` unique constraint conflicts if re-importing | `ImportLog` tracks skipped/failed counts; upsert logic lives in the worker, not the schema |

## Migration Plan

1. Edit `packages/db/prisma/schema.prisma` with all additions.
2. Run `prisma migrate dev --name extend-schema` to generate and apply the migration SQL.
3. Commit both `schema.prisma` and the generated migration file.
4. Update `packages/db/src/index.ts` to export `Notification`, `StudentRecord`, `ImportLog` types.
5. Rollback: `prisma migrate resolve --rolled-back <migration-name>` + revert schema + drop new tables/columns manually if needed (destructive; coordinate with team).
