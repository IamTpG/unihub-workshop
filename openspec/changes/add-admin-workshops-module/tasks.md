## 1. Developer A - Shared Queue Contract

- [x] 1.1 Add `AI_SUMMARY_QUEUE_NAME = "ai-summary-queue"` to shared queue constants.
- [x] 1.2 Add an AI summary job payload type with `workshopId` and `pdfUrl` string fields.
- [x] 1.3 Add or update shared exports so API code can import the queue constant and payload type from `@unihub/shared`.

## 2. Developer A - Admin Workshop Data Layer

- [x] 2.1 Create `apps/api/src/modules/admin-workshops/` with repository, service, controller, routes, and schema files.
- [x] 2.2 Implement repository methods for create, paginated list, update, find-by-id, and registration counts by status using Prisma from `@unihub/db`.
- [x] 2.3 Ensure create persistence initializes `availableSlots` from submitted `capacity`.
- [x] 2.4 Ensure update persistence returns a not found error when the workshop ID does not exist.

## 3. Developer B - Validation, Service, and Queue Triggering

- [x] 3.1 Define Zod schemas for create body, update body, ID params, and pagination query parameters.
- [x] 3.2 Implement service methods for create, list, update, and stats using the repository.
- [x] 3.3 Add API-side BullMQ queue wiring for `ai-summary-queue`.
- [x] 3.4 Enqueue `{ workshopId, pdfUrl }` after successful create when `pdfUrl` is present.
- [x] 3.5 Enqueue `{ workshopId, pdfUrl }` after successful update when `pdfUrl` is provided in the update payload.

## 4. Developer B - Routes and API Integration

- [x] 4.1 Implement controller handlers using existing response helpers and error forwarding.
- [x] 4.2 Implement routes for `POST /admin/workshops`, `GET /admin/workshops`, `GET /admin/workshops/:id`, `PUT /admin/workshops/:id`, and `GET /admin/workshops/:id/stats`.
- [x] 4.3 Protect every admin workshop route with `authenticate` and `requireRoles([Role.ADMIN])`.
- [x] 4.4 Register the admin workshop routes in the API route index under `/api/v1/admin/workshops`.

## 5. Verification

- [x] 5.1 Run API linting and fix issues introduced by the change.
- [x] 5.2 Run API build and fix TypeScript errors introduced by the change.
- [x] 5.3 Search for stale hard-coded AI summary queue names outside the shared constant.
- [x] 5.4 Verify the OpenSpec task list is fully checked when implementation is complete.
