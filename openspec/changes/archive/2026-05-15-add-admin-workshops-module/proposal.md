## Why

Course administrators need a protected API surface to create, update, list, and inspect workshop records for the UniHub Workshop workflow. This slice matters for the course requirements because workshop publishing and capacity tracking are core to registration, check-in, reporting, and AI-assisted workshop summaries.

## What Changes

- Add an admin workshop module under `apps/api/src/modules/admin-workshops/`.
- Add protected admin endpoints for creating workshops, listing workshops with pagination, updating workshops, and reading workshop registration stats.
- Require RBAC protection on every admin workshop route using the existing `requireRoles` middleware.
- Persist workshop data through Prisma, including `roomLayoutUrl`, `pdfUrl`, and `availableSlots`.
- Trigger a BullMQ job on `ai-summary-queue` with `{ workshopId, pdfUrl }` after creating or updating a workshop with a PDF URL.
- Non-goals:
  - No frontend upload implementation; the frontend provides `roomLayoutUrl` and `pdfUrl` as strings.
  - No AI summary processor implementation in this change.
  - No registration, payment, check-in, or workshop public browsing behavior changes.
  - No database schema redesign unless implementation discovers a blocking mismatch.

## Capabilities

### New Capabilities
- `admin-workshops`: Admin-only workshop management API, including create, list, update, stats, and AI summary queue triggering.

### Modified Capabilities
- None.

## Impact

- New API module files under `apps/api/src/modules/admin-workshops/`.
- API route registration for `/admin/workshops`.
- Prisma access through `@unihub/db`.
- BullMQ queue wiring for `ai-summary-queue`.
- Existing RBAC middleware usage for route protection.
