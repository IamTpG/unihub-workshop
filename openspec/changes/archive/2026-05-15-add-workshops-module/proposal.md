## Why

Students need a fast, safe API for browsing published workshops during high-traffic registration windows. This slice matters for the course requirements because it supports the student workshop discovery flow while protecting internal asset URLs and reducing database load for concurrent traffic.

## What Changes

- Add a public workshop module under `apps/api/src/modules/workshops/`.
- Add `GET /workshops` for the student fast-view list of published workshops only.
- Cache the published workshop list in Redis at `workshops:published` for 5 minutes before falling back to Prisma.
- Enrich `GET /workshops` list items with live `availableSlots` using one Redis `MGET` over `workshop:{id}:slots` keys.
- Add `GET /workshops/:id` for a student-safe workshop detail view.
- Add `GET /workshops/:id/availability` for live available slot counts using Redis key `workshop:{id}:slots`, with Prisma fallback only when the cache is missing.
- Restrict response fields so students never receive `pdfUrl`, and list responses also never receive `roomLayoutUrl`.
- Non-goals:
  - No registration or payment behavior changes.
  - No admin workshop management changes.
  - No AI summary generation changes.
  - No new database schema changes unless implementation discovers an existing schema blocker.

## Capabilities

### New Capabilities
- `workshops`: Student-facing workshop browsing API, including published list, safe detail view, and live availability lookup with Redis caching.

### Modified Capabilities
- None.

## Impact

- New API module files under `apps/api/src/modules/workshops/`.
- API route registration for `/api/v1/workshops`.
- Prisma read queries through `@unihub/db`.
- Redis cache reads and writes through existing API Redis infrastructure.
- Student-facing API contracts for list, detail, and availability responses.
