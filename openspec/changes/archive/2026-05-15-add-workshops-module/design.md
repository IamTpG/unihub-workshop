## Context

The API already has module-based routing under `apps/api/src/modules`, Prisma access through `@unihub/db`, and Redis access through `apps/api/src/infra/redis/redis.ts`. Admin workshop management exists separately under `admin-workshops`; this change adds the student-facing read module with stricter response projections and cache-first reads for high traffic.

The workshop list is expected to serve up to 12,000 concurrent users, so the list endpoint must avoid repeatedly querying PostgreSQL for stable published workshop data. Availability is more dynamic and must read Redis first using a per-workshop slots key.

## Goals / Non-Goals

**Goals:**
- Add `apps/api/src/modules/workshops/` with controller, service, repository, schema, and routes.
- Register student-facing routes under `/api/v1/workshops`.
- Protect all workshop routes with `authenticate` and `requireRoles([Role.STUDENT])`.
- Return only published workshops from paginated `GET /workshops` requests.
- Cache the full published list at `workshops:published` with a 5-minute TTL, then paginate after cache retrieval.
- Exclude `roomLayoutUrl` and `pdfUrl` from list responses.
- Include live `availableSlots` in list responses by fetching `workshop:{id}:slots` keys with one Redis `MGET`.
- Return student-safe workshop detail fields from `GET /workshops/:id`, excluding `pdfUrl`, with static metadata cached separately from live slots.
- Return live availability from Redis key `workshop:{id}:slots`, with Prisma fallback when the key is missing.

**Non-Goals:**
- No admin route or RBAC changes.
- No registration slot decrement implementation.
- No cache invalidation from admin create/update flows in this change.
- No database schema migration.

## Decisions

1. Use a dedicated public `workshops` module.
   - Rationale: Student read APIs have different response projections, caching rules, and traffic needs from admin management APIs.
   - Alternative considered: Reuse `admin-workshops` service methods. This was rejected because admin responses can include fields that students must not receive.

2. Protect student workshop routes at the router level.
   - Rationale: Every workshop view endpoint is for logged-in students only. Applying `authenticate` and `requireRoles([Role.STUDENT])` in routes keeps access control explicit and consistent.
   - Alternative considered: Check roles inside each service method. This would duplicate authorization across handlers.

3. Keep field selection in repository queries.
   - Rationale: Prisma `select` prevents accidental leakage of `pdfUrl` and avoids fetching fields the endpoint must not expose.
   - Alternative considered: Query full records and strip fields in service. This is easier to write but riskier for student-safe contracts.

4. Cache the full published list as serialized JSON at `workshops:published` for 300 seconds, then paginate in service.
   - Rationale: The published list is read-heavy and changes infrequently during a demo. Caching the full list lets the service enrich list items with live availability in a single Redis `MGET` and still return paginated API responses.
   - Alternative considered: Page-specific cache keys. This keeps each cached value smaller but requires separate list caches per page and does not match the requested `workshops:published` cache contract.

5. Use Redis as the source of truth for hot availability reads when present.
   - Rationale: Registration flows can keep `workshop:{id}:slots` hot while students poll availability. Prisma is only the fallback for cache miss or Redis failure.
   - Alternative considered: Always query Prisma for availability. This conflicts with the high-traffic requirement.

6. Fall back to Prisma when Redis fails.
   - Rationale: Redis outages should degrade performance, not make workshop browsing unavailable. Failed Redis writes after a Prisma fallback should not fail the response.
   - Alternative considered: Fail requests when Redis is unavailable. This protects the database but creates a worse demo and student experience.

## Critical Flows

Published list:
1. Controller receives `GET /workshops`.
2. `authenticate` verifies the access token and populates `req.user`.
3. `requireRoles([Role.STUDENT])` authorizes the student role.
4. Schema validates `page` and `limit`, applying defaults when omitted.
5. Service attempts to read cached JSON from `workshops:published`.
6. If missing or malformed, service asks repository for published workshops using a Prisma `select` with student list fields and `availableSlots`, then caches the list for 300 seconds.
7. Service extracts workshop IDs from the list and builds `workshop:{id}:slots` keys.
8. Service calls Redis `MGET` once for all slot keys.
9. Service maps returned slot values back to list items, using each item's existing `availableSlots` when a Redis slot key is missing or `MGET` fails.
10. Service paginates the enriched list and returns items plus pagination metadata.

Workshop detail:
1. Controller receives `GET /workshops/:id`.
2. Schema validates `id`.
3. Service attempts to read static metadata from Redis key `workshop:{id}:detail`.
4. If missing or malformed, service asks repository for the workshop using a Prisma `select` with detail metadata fields only, excluding `availableSlots`, then caches it for 300 seconds.
5. Service calls the availability lookup to read live slots from `workshop:{id}:slots` with Prisma fallback.
6. Controller returns the safe detail payload merged with live `availableSlots`.

Availability:
1. Controller receives `GET /workshops/:id/availability`.
2. Schema validates `id`.
3. Service attempts `GET workshop:{id}:slots` from Redis.
4. If present, service returns the numeric slot value without a Prisma query.
5. If missing or Redis read fails, service asks repository for `availableSlots`.
6. If the workshop exists, service attempts to write the slot value to Redis and returns it.

## Risks / Trade-offs

- Stale published list cache -> The 5-minute TTL can temporarily show stale list data after admin changes. This is acceptable for the MVP and can be improved later with admin-side cache invalidation.
- Redis outage increases DB load -> Prisma fallback preserves functionality, but high concurrency can pressure PostgreSQL. Mitigate by keeping queries narrow with `select` and restoring Redis quickly.
- Cache JSON parse errors -> Treat malformed cached JSON like a miss and refresh from Prisma.
- Stale detail metadata -> Static detail metadata can lag for up to 5 minutes after admin edits. `availableSlots` is intentionally excluded from the detail metadata cache and merged live.
- Availability fallback can be stale if Redis is down -> Prisma returns the persisted value, which may lag any queue-based slot holds. This is the best available fallback without changing registration flows.
