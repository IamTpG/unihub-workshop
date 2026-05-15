## Context

The UniHub Workshop backend currently handles registration through a well-designed async pipeline: API validates → Redis DECR slot → BullMQ queue → Worker processes. However, three infrastructure gaps exist:

1. **No rate limiting** — The API has zero protection against burst traffic. The `infra/rate-limit/` directory contains only `.gitkeep`.
2. **No circuit breaker** — `registration.processor.ts` calls `provider.createIntent()` directly (line 86). If the payment gateway hangs, all 1000 concurrent worker threads stall.
3. **No check-in endpoints** — `modules/checkins/` is empty. The `Registration.checkedInAt` field exists but is unreachable.
4. **No notification delivery** — `notificationQueue` receives jobs but nothing consumes them. No notification processor exists in the worker app.

**Current architecture (relevant pieces):**

```
API (Express)                          Worker (BullMQ)
├── middleware/                         ├── processors/
│   ├── auth.middleware.ts              │   ├── registration.processor.ts  ← calls payment directly
│   ├── idempotency.middleware.ts       │   ├── payment-timeout.processor.ts
│   └── (no rate-limit)                 │   └── mail.processor.ts
├── infra/                              │   └── (no notification processor)
│   ├── rate-limit/.gitkeep             └── queue.ts (4 queues defined)
│   ├── circuit-breaker/.gitkeep
│   ├── payment/ (mock provider)
│   └── redis/
├── modules/
│   ├── checkins/.gitkeep  ← empty
│   ├── notifications/.gitkeep  ← empty
│   └── registrations/ (fully implemented)
```

## Goals / Non-Goals

**Goals:**
- Protect API from burst traffic during registration openings (12,000 students, 60% in first 3 minutes)
- Isolate payment gateway failures so browse flow (`GET /workshops`) remains unaffected
- Enable staff to check in attendees via API, including batch sync for offline scenarios
- Deliver real-time notifications to connected frontend clients via SSE

**Non-Goals:**
- WebSocket support — SSE is sufficient for one-way push
- Frontend notification UI — backend delivery mechanism only
- Real payment provider (Stripe/VNPay) integration — mock with circuit breaker wrapper
- Distributed rate limiting across multiple API instances — single instance is sufficient for demo

## Decisions

### D1: Rate Limiter — `express-rate-limit` + `rate-limit-redis`

**Choice:** Use `express-rate-limit` with `@redis/rate-limit` store.

**Why not in-memory?** Rate limit state lives in RAM, lost on restart, and doesn't work if we ever add a second API instance. Redis store is trivial to add since Redis is already in the stack.

**Configuration strategy:**
- **Global default:** 100 requests per 60 seconds per IP
- **Auth endpoints** (`POST /auth/request-otp`): 5 requests per 60 seconds per IP (prevent OTP spam)
- **Registration endpoint** (`POST /registrations`): 10 requests per 60 seconds per user (authenticated)
- Response: `429 Too Many Requests` with `Retry-After` header

**Sequence — Rate-limited request:**
1. Request arrives at Express
2. Rate limit middleware checks Redis counter for `rl:<IP>` or `rl:<userId>`
3. If under limit → increment counter, pass to next middleware
4. If over limit → return `429` immediately, no downstream processing

### D2: Circuit Breaker — `opossum` wrapping payment calls

**Choice:** Use `opossum` (battle-tested Node.js circuit breaker) to wrap `provider.createIntent()` inside the registration worker.

**Why at the Worker level, not API level?** The API already delegates to BullMQ. The actual payment call happens in `registration.processor.ts`. That's where the circuit breaker belongs.

**Configuration:**
- `timeout`: 5000ms (fail fast if payment gateway doesn't respond in 5s)
- `errorThresholdPercentage`: 50 (open circuit after 50% failure rate)
- `resetTimeout`: 30000ms (try again after 30s in half-open state)
- `volumeThreshold`: 5 (minimum 5 requests before circuit logic activates)

**Fallback behavior:** When circuit is OPEN, the worker still creates the registration with status `HOLDING` and sets `paymentRef: null`. A `PAYMENT_RETRY` notification is queued. The existing `payment-timeout.processor.ts` will expire the registration after 30 minutes if payment never completes.

**Sequence — Payment call with circuit breaker:**
1. Worker picks up registration job
2. Stage 1: Atomic DB transaction (unchanged — decrement slot, create registration)
3. Stage 2: `paymentBreaker.fire(amount, currency, metadata)`
   - **Circuit CLOSED:** Call goes through to `provider.createIntent()`
     - Success → update registration to `HOLDING` with `paymentRef`
     - Failure → fallback: `HOLDING` with `paymentRef: null`, queue `PAYMENT_RETRY` notification
   - **Circuit OPEN:** Fallback fires immediately (no network call), same behavior as failure
   - **Circuit HALF-OPEN:** One probe request allowed through
4. Payment timeout job scheduled regardless (30 min safety net)

**Failure isolation guarantee:** Because the circuit breaker is in the Worker process (not the API process), even if payment is completely down, the API process serving `GET /workshops` is 100% unaffected — they are separate Node.js processes.

### D3: Check-in API — Conditional UPDATE on Registration

**Choice:** Check-in is an UPDATE to `Registration.checkedInAt`, not a separate table.

**Why not a separate `check_ins` table?** The schema already has `checkedInAt` on `Registration`. A separate table adds a JOIN and duplicates the relationship. The operation is naturally idempotent: updating the same field to the same value is a no-op.

**Endpoints:**
- `POST /api/v1/check-ins/:registrationId` — Single check-in (staff scans QR)
- `POST /api/v1/check-ins/batch` — Batch sync (offline check-ins)

**Dedupe strategy for batch sync:**
- Each record in the batch carries its `registrationId`
- The UPDATE uses `WHERE checked_in_at IS NULL AND status = 'PAID'`
- If already checked in → row not updated (idempotent), counted as skipped
- If status is not `PAID` → row not updated, counted as failed
- Response includes `processedCount`, `skippedCount`, and `failedIds`

**Sequence — Batch check-in:**
1. Staff app sends `POST /check-ins/batch` with array of `{ registrationId, checkedInAt }`
2. API validates: caller must have `STAFF` or `ADMIN` role
3. Wrap all updates in `prisma.$transaction`
4. For each item: `UPDATE registrations SET checked_in_at = $1 WHERE id = $2 AND checked_in_at IS NULL AND status = 'PAID'`
5. Return summary: `{ processedCount: 8, skippedCount: 2, failedIds: ["abc"] }`
6. Queue notification jobs for successfully checked-in users

### D4: SSE Notifications — Redis Pub/Sub bridge

**Choice:** Server-Sent Events over Redis Pub/Sub. No WebSocket.

**Why SSE over WebSocket?** SSE is native HTTP (works through proxies, no upgrade handshake), built into every browser via `EventSource`, and we only need server→client push. WebSocket's bidirectional capability is unnecessary overhead.

**Architecture:**

```
Worker (notification.processor.ts)
  │
  │  consume notification-queue job
  │  redis.publish(`notifications:user:<userId>`, JSON payload)
  ▼
Redis Pub/Sub
  │
  │  message on channel `notifications:user:<userId>`
  ▼
API (SSE endpoint: GET /api/v1/notifications/stream)
  │
  │  res.write(`data: ${JSON.stringify(event)}\n\n`)
  ▼
Browser (EventSource)
```

**Sequence — Notification delivery:**
1. Payment webhook fires → `notificationQueue.add('notify', { userId, type: 'REGISTRATION_PAID', ... })`
2. Notification processor picks up job → `redis.publish('notifications:user:<userId>', payload)`
3. API SSE endpoint has `redis.subscribe('notifications:user:<userId>')` for each connected client
4. On message → write SSE event to response stream
5. Client receives event via `EventSource.onmessage`

**Connection lifecycle:**
- Client connects: `GET /api/v1/notifications/stream` (requires auth)
- Server: subscribes to `notifications:user:<userId>` Redis channel
- Server: sends keepalive comment (`:keepalive\n\n`) every 30 seconds
- Client disconnects: server unsubscribes from Redis channel, closes response

## Risks / Trade-offs

**[Risk] SSE connections consume memory per connected user**
→ Mitigation: Each connection is lightweight (~few KB). For 12,000 users, this is ~50MB — acceptable. Add a max connections limit if needed.

**[Risk] Redis Pub/Sub messages are fire-and-forget — if no subscriber is listening, message is lost**
→ Mitigation: This is acceptable for real-time notifications. If the user is not connected when the event fires, they miss it. For critical state (registration status), the frontend should also poll `GET /registrations/:id` as a fallback.

**[Risk] Rate limiter may block legitimate batch-sync requests from staff devices**
→ Mitigation: Staff/Admin roles get higher rate limits. The batch endpoint accepts up to 100 records per request, reducing the number of HTTP calls needed.

**[Trade-off] Circuit breaker in worker means the API cannot immediately tell the user "payment is down"**
→ Acceptable: The API already returns `202 Accepted` (async). The user learns about payment status through notifications or polling. This is the existing contract.
