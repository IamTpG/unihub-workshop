## Why

UniHub Workshop needs a registration and payment flow so students can claim seats and pay for workshops — without race conditions when 12,000 concurrent users hit the same endpoint. Without this, seat overselling and double-charges are guaranteed at scale.

## What Changes

- New `POST /workshops/:id/register` endpoint using Redis atomic DECR as a fast-path gate before any DB write
- New BullMQ `registration-queue` consumer in `apps/worker` that performs the authoritative DB transaction (Prisma atomic update + Registration record)
- New `POST /payments/webhook/:provider` endpoint for payment finalization, seat release on failure/timeout
- New idempotency middleware (`x-idempotency-key`) backed by Redis (24 h TTL) applied to all write endpoints
- New `PaymentProvider` interface + `MockPaymentProvider` in `apps/api/src/infra/payment/`
- New `RegStatus` enum and payment interfaces in `packages/shared`
- Notification stub: enqueue `notification-queue` job on successful payment

**Non-goals (this change):**
- Real payment gateway integration (Stripe/VNPay/MoMo) — mock only
- QR code generation beyond a stub string
- Email/push notification delivery — queue job only
- Admin refund UI

## Capabilities

### New Capabilities

- `workshop-registration`: Student-facing registration gate — Redis DECR soft reservation, BullMQ job enqueue, 202 response with jobId
- `registration-worker`: Worker-side authoritative transaction — atomic DB seat decrement, Registration record creation, payment intent initiation, HOLDING/PAID state transitions
- `payment-webhook`: Webhook endpoint for payment provider callbacks — PAID finalization, FAILED/EXPIRED seat release, notification job enqueue
- `idempotency-middleware`: Generic Redis-backed idempotency layer for write endpoints (24 h TTL, in-progress/completed response replay)
- `payment-provider`: Provider/Strategy abstraction — `PaymentProvider` interface + `MockPaymentProvider` implementation

### Modified Capabilities

- `workshops`: `available_slots` field participates in atomic update during registration worker transaction (implementation detail only — no spec-level requirement change)

## Impact

- **New DB model:** `Registration` (userId, workshopId, status, paymentIntentId, expiresAt)
- **Prisma schema:** `packages/db/prisma/schema.prisma` — add `Registration` model, add `available_slots` to `Workshop`
- **New packages:** none (BullMQ already used, Redis already present)
- **API routes:** `apps/api/src/modules/registrations/`, `apps/api/src/infra/payment/`
- **Worker processors:** `apps/worker/src/processors/registration.processor.ts`, `apps/worker/src/processors/payment-timeout.processor.ts`
- **Shared types:** `packages/shared/src/types/registration.ts`, `packages/shared/src/types/payment.ts`
