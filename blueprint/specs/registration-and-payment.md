# Specification: Workshop Registration & Payment

## Description

This capability lets a **student reserve a seat** in a published workshop under extreme concurrency (~12,000 users, with most traffic in the first minutes of opening). The system must **never oversell** the last seat, must survive **network retries** without duplicate charges or duplicate reservations, and must tolerate **unstable payment services** without blocking workshop browsing or free registrations.

Paid workshops enter a **holding** state until payment succeeds, fails, or times out (30 minutes). Free workshops confirm immediately. MVP uses a **mock payment provider** and in-app simulation; the payment interface is swappable for production gateways.

---
## Main Flow

### 1. Register for a workshop

1. A **student** submits registration for a published workshop with header `x-idempotency-key` (unique per logical attempt).
2. The system validates: authenticated student, **ACTIVE** `StudentRecord`, workshop published, optional registration window, no conflicting existing registration.
3. The system performs a **fast seat check** (decrement live slot counter). If no seats remain → reject without creating a registration.
4. The system accepts the request with **`202 Accepted`** and `{ jobId }`, and processes the reservation **asynchronously**.
5. Duplicate submissions with the same idempotency key receive the **same response** as the first successful call, or `409` if still in progress.

**API:** `POST /api/v1/workshops/:workshopId/register`  
**Rate limit:** 10 requests per minute per student.

**Pre-check failures (no seat counter change):**

| Condition | Response |
|-----------|----------|
| Missing idempotency key | `400` |
| Not authenticated | `401` |
| Not a student | `403` |
| Inactive / missing roster record | `403` |
| Workshop not found | `404` |
| Not published / outside window | `400` |
| Already registered or pending | `400` |
| No seats (fast gate) | `400 Workshop Full` |

### 2. Complete the reservation (async)

The system commits the seat in the database atomically and creates a `Registration` row.

- If the database has **no seats left** (race with other requests), the job fails, the fast slot counter is **restored**, and no registration is left in a confirmed state.
- If **`price = 0`**: registration becomes **`PAID`**, QR stub is set (`qrStub = registration id`), confirmation notification is sent.
- If **`price > 0`**: registration becomes **`HOLDING`**, a payment intent is created when the gateway is healthy, `expiresAt` is set to **30 minutes from now**, and a delayed timeout is scheduled.

When the payment gateway is slow or unavailable, the registration may remain **`HOLDING`** with no `paymentRef`; the student is notified to retry payment within the hold period.

### 3. Pay for a held seat (mock MVP)

1. The student opens **My Registrations** and selects a **HOLDING** ticket.
2. **Payment details** show amount due and a pay action. If no payment reference exists, pay is disabled with a service-unavailable message; the student may use **retry payment** (see §6).
3. **Mock gateway** offers “Simulate Success” and “Simulate Failure,” which deliver a signed webhook event to the system.
4. The student sees a **result** screen after the system updates status (poll registration until `PAID` or `FAILED`, or show processing message on timeout).

**Webhook (demo):** `POST /api/v1/payments/webhook/mock`  
Body includes `eventType`, `intentId` (matches `paymentRef`), `eventId` (unique per delivery).

### 4. Payment webhook (provider callback)

Payment providers notify the system of success or failure.

**API:** `POST /api/v1/payments/webhook/:provider`

1. Verify provider signature; reject invalid with `400`.
2. Deduplicate by `eventId` — replays return `200` without side effects.
3. Find registration by payment intent id; unknown intent → `200` (acknowledge, do not retry-loop).

| Event | Effect (only if registration is `HOLDING`) |
|-------|---------------------------------------------|
| `PAYMENT_SUCCEEDED` | `PAID`, set QR stub, notify student |
| `PAYMENT_FAILED` / `PAYMENT_EXPIRED` | `FAILED` or `EXPIRED`, **release seat**, notify student |

If registration is already `PAID`, `EXPIRED`, or `FAILED`, webhook processing **does nothing** (no seat change, no downgrade).

### 5. Payment timeout

If a **`HOLDING`** registration is not paid within **30 minutes**, the system sets status to **`EXPIRED`**, releases the seat (database and live counter), and notifies the student. If payment completed just before timeout, status remains **`PAID`** and no seat is released.

### 6. View and retry registrations

| API | Purpose |
|-----|---------|
| `GET /api/v1/registrations` | List own registrations; filter by status |
| `GET /api/v1/registrations/:id` | Single registration with workshop summary |
| `POST /api/v1/registrations/:id/retry-payment` | For `HOLDING` without `paymentRef` — re-attempt payment intent |

Students may only access their own registrations (`404` for others).

### 7. Re-register after failure

If a prior registration ended in **`FAILED`** or **`EXPIRED`**, the system removes the stale row when the student registers again so they may claim a newly released seat. **`CANCELLED`** is handled similarly at the application layer.

---

## Idempotency

**Registration:** Header `x-idempotency-key` required on `POST .../register`.

- First request: claim key as in-progress, execute, cache response (24h).
- Concurrent duplicate: `409 Request already in progress`.
- Retry after success: same HTTP status and body as original.
- Handler error (5xx): key cleared so client may retry.

**Webhooks:** Deduplicate by provider `eventId` (24h).

**Client rule:** Generate a **new UUID** per distinct registration attempt; reuse the same key only when retrying the same logical operation.

---

## Seat integrity (two-step gate)

1. **Fast gate:** Decrement live slot counter before accepting `202`. If negative, roll back and reject as full.
2. **Authoritative commit:** Decrement `workshops.available_slots` in the database inside the async job. On failure, restore the live counter.

This prevents thundering herd on a single database row while keeping the database as source of truth.

---

## Payment provider abstraction

All gateways implement:

- `createIntent(amount, currency, metadata)` → `{ intentId, clientSecret }`
- `verifyWebhook(payload, signature, secret)` → `{ eventType, intentId, eventId }`
- `refund(intentId, amount)` → `{ refundId }`

**Mock (MVP):** Deterministic in-process intents; webhook parses test payloads. Not allowed when `NODE_ENV=production`.

**Circuit breaker** around intent creation: on sustained failures, fail fast; registration still becomes `HOLDING` without `paymentRef`; student notified to retry. Workshop browsing and free registration are unaffected.

---

## Data Model

### Registration

```
Registration {
  id, userId, workshopId
  status: PENDING | HOLDING | PAID | FAILED | EXPIRED | CANCELLED
  idempotencyKey (unique)
  paymentRef?, qrStub?, expiresAt?
  checkedInAt?  // check-in spec
  UNIQUE (userId, workshopId)
}
```

### Status machine

```text
[PENDING] → (async) → [PAID]           if free
                   → [HOLDING]        if paid
[HOLDING] → [PAID]     on payment success
         → [FAILED]    on payment failure
         → [EXPIRED]   on 30m timeout
```

`PAID` sets `qrStub` to registration `id` for check-in.

---

## Error Scenarios

| Scenario | Behavior |
|----------|----------|
| Idempotency key missing | `400` |
| Duplicate in-flight key | `409` |
| Idempotency replay | Cached response |
| Workshop full at fast gate | `400`, no job |
| Workshop full at DB commit | Job fails, counter restored |
| Payment gateway down | `HOLDING`, null `paymentRef`, retry path |
| Webhook invalid signature | `400` |
| Webhook duplicate `eventId` | `200`, no-op |
| Success webhook after expiry | `200`, no seat resurrection |
| Failure webhook on `PAID` | `200`, no seat release |
| Mock pay network error | User message; stays `HOLDING` |
| Unknown webhook intent | `200`, logged |

---

## Constraints

- At most one active confirmed seat per student per workshop (`PAID` / pending hold).
- Database `available_slots` must never go negative.
- Webhook handlers must use **conditional updates** (`status = HOLDING` only).
- Webhooks must **acknowledge** unknown intents with `200`.
- Registration endpoint: students only; roster must be **ACTIVE**.
- Hold duration: **30 minutes**, aligned with timeout job.
- Browse/list workshops must not depend on payment health.
- Mock payment URL: `/api/v1/payments/webhook/mock`.

---

## Acceptance Criteria

- Valid student registration returns `202 { jobId }` when seats available.
- Idempotency prevents double seat take from retries.
- Full workshop rejected at gate without async job.
- Registration window and roster rules enforced before seat gate.
- Free workshop ends `PAID` with QR stub and notification.
- Paid workshop ends `HOLDING` with expiry and timeout scheduled.
- Gateway failure still yields `HOLDING` with retry notification.
- Timeout releases seat only from `HOLDING`.
- Webhook success moves `HOLDING` → `PAID`; failure/expiry releases seat.
- Late webhook after expiry does not restore seat.
- Student can list and view own registrations only.
- Mock pay success/failure updates status; UI shows result.
- Pay disabled when `paymentRef` null; retry-payment re-attempts intent.
- Load test: no oversell below capacity for concurrent register storm.
