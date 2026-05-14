## 1. Developer A - Module Structure and Validation

- [x] 1.1 Create `apps/api/src/modules/workshops/` with controller, service, repository, schema, and routes files.
- [x] 1.2 Define Zod schemas for workshop ID params and list pagination query params.
- [x] 1.3 Register workshop routes under `/api/v1/workshops`.

## 2. Developer A - Repository Field Projections

- [x] 2.1 Implement a Prisma repository method for paginated published workshop list using `status = PUBLISHED`.
- [x] 2.2 Ensure list selection returns only `id`, `title`, `speakerName`, `location`, `startTime`, `endTime`, `capacity`, `availableSlots`, `price`, and `aiSummary`.
- [x] 2.3 Implement a Prisma repository method for workshop detail by ID.
- [x] 2.4 Ensure detail selection returns only `id`, `title`, `speakerName`, `location`, `startTime`, `endTime`, `capacity`, `price`, `description`, `roomLayoutUrl`, and `aiSummary`.
- [x] 2.5 Implement a Prisma repository method for `availableSlots` by workshop ID.

## 3. Developer B - Redis Cache Behavior

- [x] 3.1 Implement service cache lookup for `GET /workshops` using Redis key `workshops:published`.
- [x] 3.2 On published list cache miss, query Prisma and store the JSON result in Redis with a 300-second TTL.
- [x] 3.3 Handle malformed or unavailable Redis list cache by falling back to Prisma.
- [x] 3.4 Implement service availability lookup using Redis key `workshop:{id}:slots`.
- [x] 3.5 On availability cache miss, query Prisma `availableSlots`, store it in Redis, and return it.
- [x] 3.6 Handle unavailable Redis availability cache by falling back to Prisma.
- [x] 3.7 Enrich `GET /workshops` items with live slot values using one Redis `MGET` call and DB list values as fallback.
- [x] 3.8 Cache `GET /workshops/:id` static metadata at `workshop:{id}:detail` and merge live availability through `getAvailability`.

## 4. Developer B - Controller and Routes

- [x] 4.1 Implement `GET /workshops` controller handler using existing response helpers and error forwarding.
- [x] 4.2 Implement `GET /workshops/:id` controller handler with cached metadata, live availability, and not found behavior.
- [x] 4.3 Implement `GET /workshops/:id/availability` controller handler with not found behavior.
- [x] 4.4 Ensure route order prevents `/:id` from capturing `/availability`-style nested routes incorrectly.
- [x] 4.5 Protect every workshop route with `authenticate` and `requireRoles([Role.STUDENT])`.

## 5. Verification

- [x] 5.1 Run API linting and fix issues introduced by the change.
- [x] 5.2 Run API build and fix TypeScript errors introduced by the change.
- [x] 5.3 Search workshop response code to confirm `pdfUrl` is never selected for student routes.
- [x] 5.4 Search list response code to confirm `roomLayoutUrl` is not selected for `GET /workshops`.
