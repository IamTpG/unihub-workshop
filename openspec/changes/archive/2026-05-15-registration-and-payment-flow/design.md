## Context

UniHub Workshop already has a Redis-cached workshop browsing module (Phase 1). Phase 2 adds student registration with real seat control. The core challenge: 12,000 concurrent POSTs to the same `/workshops/:id/register` endpoint must not oversell seats and must not create thundering-herd pressure on PostgreSQL.

Current state: no `Registration` model, no seat counter in DB or Redis, no payment integration, no idempotency layer.

## Goals / Non-Goals

**Goals:**
- Prevent seat overselling under high concurrency using a two-tier gate (Redis DECR → DB atomic update)
- Protect against double-registration from network retries via idempotency middleware
- Decouple the HTTP response time from DB transaction time using BullMQ
- Provide a swappable payment abstraction that works with a mock today and a real provider later
- Release seats reliably on payment failure/timeout

**Non-Goals:**
- Real payment gateway integration
- QR code rendering (stub string only)
- Notification delivery (enqueue only)
- Admin refund UI
- Job status polling endpoint (out of scope for this change)

## Decisions

### Decision 1: Two-tier seat gate (Redis DECR + DB atomic update)

**Choice:** Redis `DECR workshop:{id}:slots` as a fast-fail gate; PostgreSQL `UPDATE workshops SET available_slots = available_slots - 1 WHERE available_slots > 0` as the authoritative commit.

**Why not DB-only:** A direct DB write at 12k concurrency creates lock contention on the `workshops` row. Rejected.

**Why not Redis-only:** Redis is not the system of record. A crash between Redis DECR and DB write would lose a seat permanently. The two-tier pattern keeps Redis as a rate limiter and DB as truth.

**Failure path:** If the DB atomic update matches 0 rows (race condition: Redis said OK but DB is actually 0), the worker INCRs Redis back, deletes the optimistic reservation, and marks the job failed. Client polls or gets a notification.

### Decision 2: BullMQ for async DB work (concurrency: 1000)

**Choice:** Return `202 Accepted` with `jobId` immediately after Redis DECR succeeds. Worker processes the job asynchronously.

**Why:** Keeps API response time < 200 ms regardless of DB load. BullMQ's job retry and concurrency controls handle backpressure naturally.

**Trade-off:** Client must poll `/registrations/jobs/:jobId` for final status (or receive a notification). Adds UX complexity for this MVP but is necessary for scale.

### Decision 3: Provider/Strategy pattern for payments

**Choice:** `PaymentProvider` interface injected via a factory. `MockPaymentProvider` for local/test environments; real providers added by implementing the interface.

**Why:** Avoids coupling the registration worker to any specific gateway. Swap cost is writing one class.

**Interface methods:**
- `createIntent(amount, currency, metadata)` → `{ intentId, clientSecret }`
- `verifyWebhook(payload, signature, providerKey)` → `{ eventType, intentId }`
- `refund(intentId, amount)` → `{ refundId }`

### Decision 4: Idempotency middleware via Redis SET NX

**Choice:** On every write endpoint, check `idempotency:{key}` in Redis.
- Key absent → set to `IN_PROGRESS`, proceed, store response on completion.
- Key = `IN_PROGRESS` → return `409 Request In Progress`.
- Key = `DONE:{payload}` → return cached response (200/202 as original).
TTL: 24 hours. Applied as Express middleware on registration and webhook routes.

**Why Redis SET NX:** Atomic, fast, no DB roundtrip. Handles the "user refreshed during submit" scenario.

### Decision 5: Seat release on timeout via BullMQ delayed job

**Choice:** When a Registration enters `HOLDING` state, enqueue a `payment-timeout` job with a 30-minute delay. If the job fires and Registration is still `HOLDING`, update status to `EXPIRED`, increment `available_slots` in DB and Redis.

**Why:** Guarantees seats are not held forever if the payment flow is abandoned. Simple and leverages existing BullMQ infrastructure.

## Critical Flow Sequences

### Stage A — Registration Gate (API)
```
Client → POST /workshops/:id/register
  1. Idempotency middleware checks Redis
  2. Auth middleware: verify JWT, role = STUDENT
  3. Controller: GET workshop from Redis/DB, validate status=OPEN
  4. Redis DECR workshop:{id}:slots
     → result < 0: INCR back, return 400 Workshop Full
     → result ≥ 0: continue
  5. BullMQ: add job to registration-queue { userId, workshopId, idempotencyKey }
  6. Return 202 { jobId }
  7. Idempotency middleware: store DONE:{ jobId } in Redis
```

### Stage B — Registration Worker
```
Worker dequeues job { userId, workshopId }
  1. Prisma transaction:
     a. UPDATE workshops SET available_slots = available_slots - 1
        WHERE id = workshopId AND available_slots > 0
        → 0 rows updated: INCR Redis, throw → job fails
     b. INSERT registrations { userId, workshopId, status: PENDING }
  2. IF workshop.price == 0:
       UPDATE registration status = PAID
       Enqueue notification-queue job
     ELSE:
       TRY PaymentProvider.createIntent(...)
         UPDATE registration { status: HOLDING, paymentIntentId, expiresAt: now+30m }
         Enqueue payment-timeout job (delay: 30m)
       CATCH (circuit breaker):
         Log error
         UPDATE registration status = HOLDING (no intentId)
         Notify student: "retry payment within 30 minutes"
         Enqueue payment-timeout job (delay: 30m)
```

### Stage C — Webhook & Finalization
```
POST /payments/webhook/:provider
  1. Idempotency check
  2. PaymentProvider.verifyWebhook(payload, signature)
  3. Lookup Registration by intentId
  4. SWITCH eventType:
     PAYMENT_SUCCEEDED:
       UPDATE registration status = PAID
       Generate QR stub
       Enqueue notification-queue job
     PAYMENT_FAILED / PAYMENT_EXPIRED:
       UPDATE registration status = FAILED | EXPIRED
       UPDATE workshops SET available_slots = available_slots + 1
       Redis INCR workshop:{id}:slots
       Enqueue notification-queue job (failure)
  5. Return 200
```

## Risks / Trade-offs

- **Redis restart before DB commit** → Seat DECR lost, DB has accurate count. Worker INCR recovers Redis from DB on next read. Low probability, recoverable.
- **BullMQ worker crash mid-transaction** → Prisma transaction rolls back atomically; job retried with `attempts: 3`. Safe.
- **Payment provider unavailable** → Circuit breaker catches; registration enters HOLDING with no intentId; 30-min timeout releases seat. Student sees "retry payment" message.
- **Idempotency key collision** → UUID v4 from client; collision probability negligible. Doc: clients must generate unique keys per logical request.
- **DB connection pool exhaustion at 1000 concurrency** → Neon serverless scales connections; Prisma pool set to `connection_limit=20` per worker instance. Multiple worker replicas distribute load.

## Migration Plan

1. Add `Registration` model to `packages/db/prisma/schema.prisma`
2. Add `available_slots` column to `Workshop` (backfill = `total_slots`)
3. Run `prisma migrate deploy`
4. Seed Redis slot counters from DB on worker startup (`SET workshop:{id}:slots available_slots NX`)
5. Deploy worker before API (worker is additive; API changes are new routes only)
6. Rollback: remove new routes; worker ignores empty queue; `Registration` table harmless

## Open Questions

- Should `GET /registrations/jobs/:jobId` be in scope for this change? (Currently deferred — client uses websocket or polling stub)
- Notification queue processor: implement delivery in this change or separate? (Currently: enqueue only, separate change for delivery)
