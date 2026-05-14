## Context

The API already uses feature modules under `apps/api/src/modules`, global middleware under `apps/api/src/middleware`, Prisma through `@unihub/db`, and shared queue constants through `@unihub/shared`. The Prisma `Workshop` model already includes `roomLayoutUrl`, `pdfUrl`, `capacity`, `availableSlots`, and registration relations, so this change can be implemented as an API module plus queue wiring without a schema redesign.

The admin workshop API is a privileged workflow. It must require authentication first, then RBAC via `requireRoles`, before any controller or service code runs.

## Goals / Non-Goals

**Goals:**
- Add `apps/api/src/modules/admin-workshops/` with controller, service, repository, routes, and validation schema files.
- Register `/admin/workshops` routes under the API router.
- Protect every route with `authenticate` and `requireRoles([Role.ADMIN])`.
- Use Prisma repository methods for create, list, update, find, and stats queries.
- Initialize `availableSlots` to `capacity` when creating a workshop.
- Enqueue `{ workshopId, pdfUrl }` on `ai-summary-queue` after create or update when a PDF URL is provided.

**Non-Goals:**
- Implement frontend upload or file storage.
- Implement the AI summary processor.
- Change registration, payment, check-in, or public workshop browsing behavior.
- Add a new database table or migration unless implementation discovers the existing schema cannot support the required fields.

## Decisions

1. Use a dedicated `admin-workshops` API module.
   - Rationale: Admin workshop behavior has its own security, validation, and response shape. Keeping it separate avoids mixing public workshop browsing with privileged write operations.
   - Alternative considered: Put these routes in a generic `workshops` module. This was rejected because the requested routes are explicitly admin-only.

2. Protect routes at the router level with `authenticate` and `requireRoles([Role.ADMIN])`.
   - Rationale: Router-level protection keeps every admin workshop handler covered consistently and makes the security requirement visible near route declarations.
   - Alternative considered: Check roles inside each controller method. This duplicates security logic and makes missed checks more likely.

3. Use `@unihub/db` for Prisma access in the repository.
   - Rationale: Prisma ownership already lives in `packages/db`; API modules should not create their own Prisma clients.
   - Alternative considered: Import generated Prisma directly. This bypasses the shared singleton and increases connection risk.

4. Add queue naming and payload types to shared code if missing.
   - Rationale: `ai-summary-queue` is a cross-process contract between API and worker. The queue name and job payload should be defined once in `@unihub/shared`.
   - Alternative considered: Hard-code the queue name inside the admin workshop service. This is faster but makes future worker implementation more error-prone.

5. Treat AI summary enqueue as a required post-save side effect.
   - Rationale: The user explicitly requested that a job be pushed after saving when `pdfUrl` exists. The workshop save happens first; if enqueue fails, the persisted workshop is not rolled back, and the error flows through normal API error handling.
   - Alternative considered: Best-effort enqueue with successful API response even when Redis fails. That hides a broken AI summary trigger during demos and makes failures harder to notice.

## Critical Flows

Create workshop:
1. `POST /admin/workshops` enters the route stack.
2. `authenticate` populates `req.user`.
3. `requireRoles([Role.ADMIN])` authorizes the request.
4. Zod validation parses the body.
5. Controller calls service.
6. Service passes create data to repository with `availableSlots = capacity`.
7. Repository creates the Prisma `Workshop`.
8. If `pdfUrl` exists, service enqueues `{ workshopId, pdfUrl }` on `ai-summary-queue`.
9. Controller returns a created response.

Update workshop:
1. `PUT /admin/workshops/:id` passes authentication, RBAC, and validation.
2. Service verifies or updates the target workshop through the repository.
3. If the update includes `pdfUrl`, service enqueues `{ workshopId, pdfUrl }` after the update succeeds.
4. Controller returns the updated workshop.

Stats:
1. `GET /admin/workshops/:id/stats` passes authentication, RBAC, and validation.
2. Repository loads the workshop and registration counts grouped by status.
3. Service returns workshop details, grouped counts, and total count.

## Risks / Trade-offs

- Queue unavailable or enqueue timeout -> The workshop create/update remains saved because the DB write happens before the requested queue trigger. The API should surface the enqueue failure so operators know AI summary generation did not start.
- Capacity changes after registrations exist -> Updating `capacity` without recalculating `availableSlots` can create inconsistent capacity math. This MVP should only initialize `availableSlots` on create and leave broader capacity reconciliation to a later registration-management change.
- Admin-only role may be stricter than future operations need -> Start with `ADMIN` because the route namespace is `/admin`. Staff access can be added later by changing the route-level allowed roles if product requirements expand.
- Pagination defaults can drift across modules -> Keep defaults in the module schema or a shared constant if another paginated module appears.
