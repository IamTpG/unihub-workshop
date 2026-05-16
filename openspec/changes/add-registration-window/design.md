## Context

The `Workshop` table already has `registrationOpenAt` and `registrationCloseAt` columns (added in Stage 1 schema migration). No further DB migration is needed. The change wires up these columns through every application layer: admin schema validation → service persistence → public API response shape → frontend conditional UI.

The registration enforcement path is: JWT auth → student-record check → **window check (new)** → Redis slot decrement → DB write. The window check is a cheap DB-field comparison and slots no counter decrement or job queue touch on rejection.

## Goals / Non-Goals

**Goals:**
- Admins can optionally set a registration open/close window per workshop
- Registration requests outside the window are rejected with a clear 400 message
- Students see a context-aware CTA button reflecting the current window state
- Admin forms expose both fields as optional datetime inputs with cross-field validation
- Public workshop API returns both fields so frontend can compute window state without extra round-trips

**Non-Goals:**
- No push/email notification when registration opens
- No per-slot or per-cohort windows
- No retroactive cancellation of registrations submitted outside the window
- No real-time UI countdown timer

## Decisions

### 1. Enforce the window in the registration service, not middleware

The check needs the workshop record (already fetched by the service). Doing it in middleware would require a second DB lookup. Service-layer check costs nothing extra and keeps the guard close to the business logic.

**Alternatives considered:** A shared middleware guard — rejected because it duplicates the workshop fetch.

### 2. Expose both fields in the public workshop API response

The student detail page needs both timestamps to render the correct CTA state without an extra API call. Both fields are nullable and additive — no breaking change to existing consumers.

**Alternatives considered:** A computed `isRegistrationOpen: boolean` field — rejected because the frontend also needs the open/close times to display "Opens [date]" or "Closed [date]" text.

### 3. Frontend computes window state locally

`WorkshopDetail.tsx` derives `isRegistrationOpen` from `registrationOpenAt`, `registrationCloseAt`, and `Date.now()` at render time. This is correct for a detail page (loaded fresh on navigation); no polling needed.

**Alternatives considered:** A separate `/availability` endpoint extension — rejected as over-engineering for a simple time comparison.

### 4. Redis cache for workshop detail metadata

The detail cache at `workshop:{id}:detail` caches the Prisma SELECT result. By including the two new fields in the SELECT, new cache entries will carry them automatically. Existing cache entries will lack the fields until TTL expires (5 minutes). This is acceptable — the window is set by admins before going live, so the 5-minute drift window is low risk.

**Migration step:** After deploy, flush `workshop:*:detail` Redis keys (or wait for natural TTL expiry) to ensure all clients see the new fields.

### 5. Admin-side cross-field validation in Zod schema

Validation is added to `workshopRawShape` and applied as a `.superRefine` or `.refine` on the `createWorkshopSchema` and `updateWorkshopSchema`. This keeps validation colocated with the schema and testable without service logic.

## Risks / Trade-offs

- **Stale Redis cache on deploy** → Mitigation: flush `workshop:*:detail` keys after deploy, or wait 5-minute TTL. Document in migration plan.
- **Time zone handling** → Mitigation: store both fields as UTC in DB; coerce from ISO 8601 strings in Zod. Frontend displays in browser local time using `toLocaleString`.
- **Workshop-registration spec already covers window enforcement** → No delta spec change needed for that capability; existing spec is current.

## Migration Plan

1. Deploy API changes (no DB migration needed — columns already exist).
2. Run: `redis-cli KEYS "workshop:*:detail" | xargs redis-cli DEL` (or wait 5 min for natural TTL expiry) to evict stale detail cache entries.
3. Verify `GET /workshops/:id` response includes `registrationOpenAt` and `registrationCloseAt`.
4. Deploy frontend changes.
5. Test end-to-end: set a future `registrationOpenAt` on a workshop, confirm student sees "Opens [date]" and cannot submit; confirm API returns 400 if registration is attempted programmatically.

**Rollback:** Remove the two fields from the admin schema `workshopRawShape`, revert the registration service check, and revert the SELECT in `workshops.repository.ts`. Frontend fields degrade gracefully to `undefined` (treated as no window set).
