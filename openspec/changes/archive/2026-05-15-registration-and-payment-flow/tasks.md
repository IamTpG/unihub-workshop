## 1. Database & Shared Types

- [x] 1.1 Add `Registration` model to `packages/db/prisma/schema.prisma` (fields: id, userId, workshopId, status, paymentIntentId, qrStub, expiresAt, createdAt)
- [x] 1.2 Add `available_slots` column to `Workshop` model in schema (default = total_slots)
- [x] 1.3 Run `prisma migrate dev --name add-registration-model` and verify migration applies cleanly
- [x] 1.4 Define `RegStatus` enum (`PENDING`, `HOLDING`, `PAID`, `FAILED`, `EXPIRED`) in `packages/shared/src/types/registration.ts`
- [x] 1.5 Define `PaymentProvider` interface and `CreateIntentResult`, `WebhookEvent`, `RefundResult` types in `packages/shared/src/types/payment.ts`
- [x] 1.6 Export new types from `packages/shared/src/index.ts`

## 2. Idempotency Middleware

- [x] 2.1 Create `apps/api/src/middleware/idempotency.middleware.ts` — Express middleware factory using Redis SET NX
- [x] 2.2 Implement IN_PROGRESS state: set key on request entry, delete on handler error
- [x] 2.3 Implement DONE state: store response payload and status code on handler success (TTL 24 h)
- [x] 2.4 Return `400` if `x-idempotency-key` header is missing
- [x] 2.5 Return `409` if key is IN_PROGRESS, return cached response if key is DONE

## 3. Payment Infrastructure

- [x] 3.1 Create `apps/api/src/infra/payment/payment-provider.interface.ts` with `PaymentProvider` interface
- [x] 3.2 Create `apps/api/src/infra/payment/mock-payment-provider.ts` implementing `PaymentProvider` with in-memory deterministic responses
- [x] 3.3 Create `apps/api/src/infra/payment/payment-provider.factory.ts` — returns `MockPaymentProvider` by default; designed for future provider registration
- [x] 3.4 Export all payment infra from `apps/api/src/infra/payment/index.ts`

## 4. Registration Module — Repository & Service

- [x] 4.1 Create `apps/api/src/modules/registrations/registrations.repository.ts` — Prisma operations: `createPending`, `updateStatus`, `findByIntentId`, `findByUserAndWorkshop`, `releaseSlot` (atomic DB increment)
- [x] 4.2 Create `apps/api/src/modules/registrations/registrations.service.ts` — `initiateRegistration`: validate workshop, Redis DECR gate, enqueue BullMQ job, return jobId
- [x] 4.3 Add Redis slot seeding helper in service: on startup, SET `workshop:{id}:slots` from DB `available_slots` using SET NX (idempotent)

## 5. Registration Module — Controller & Routes

- [x] 5.1 Create `apps/api/src/modules/registrations/registrations.controller.ts` — `POST /workshops/:id/register` handler; apply idempotency middleware and STUDENT role guard
- [x] 5.2 Create `apps/api/src/modules/registrations/registrations.routes.ts` — mount controller with auth + role middleware chain
- [x] 5.3 Register registration routes in `apps/api/src/app.ts`

## 6. Payment Webhook Endpoint

- [x] 6.1 Create `apps/api/src/modules/registrations/payment-webhook.controller.ts` — `POST /payments/webhook/:provider` handler
- [x] 6.2 Implement signature verification via `PaymentProvider.verifyWebhook`; return `400` on failure
- [x] 6.3 Implement PAYMENT_SUCCEEDED branch: update Registration to PAID, store QR stub, enqueue notification job
- [x] 6.4 Implement PAYMENT_FAILED / PAYMENT_EXPIRED branch: update status, increment `available_slots` in DB + Redis, enqueue failure notification
- [x] 6.5 Apply idempotency middleware to webhook route using provider event ID as key
- [x] 6.6 Mount webhook routes in `apps/api/src/app.ts`

## 7. Worker — Registration Processor

- [x] 7.1 Create `apps/worker/src/processors/registration.processor.ts` — consume `registration-queue` with `concurrency: 1000`
- [x] 7.2 Implement Prisma transaction: atomic `available_slots - 1 WHERE > 0` + INSERT Registration PENDING; on 0-row update, INCR Redis and fail job
- [x] 7.3 Implement free-workshop branch: update Registration to PAID, enqueue notification job
- [x] 7.4 Implement paid-workshop branch: call `PaymentProvider.createIntent`, update Registration to HOLDING, set `expiresAt = now + 30m`, enqueue `payment-timeout` delayed job
- [x] 7.5 Implement circuit breaker catch: log error, set HOLDING with no intentId, enqueue `payment-timeout` job, emit student-notify event

## 8. Worker — Payment Timeout Processor

- [x] 8.1 Create `apps/worker/src/processors/payment-timeout.processor.ts` — consume `payment-timeout` queue
- [x] 8.2 On fire: fetch Registration; if status is still HOLDING, set EXPIRED, increment `available_slots` in DB, INCR `workshop:{id}:slots` in Redis, enqueue failure notification
- [x] 8.3 If status is PAID (already completed): no-op, complete job

## 9. Worker Registration & Startup

- [x] 9.1 Register `registration.processor` and `payment-timeout.processor` in `apps/worker/src/index.ts`
- [x] 9.2 Add Redis slot seeding on worker startup: for each open workshop, SET `workshop:{id}:slots available_slots NX`

## 10. Integration & Smoke Testing

- [x] 10.1 End-to-end test: register a student for a free workshop via API, verify job completes and Registration is PAID
- [x] 10.2 End-to-end test: register a student for a paid workshop, verify HOLDING state and timeout processor sets EXPIRED + releases slot
- [x] 10.3 Test idempotency: send duplicate registration requests with same key, verify 202 returned once and duplicate is served from cache
- [x] 10.4 Test workshop-full path: seed Redis slots to 0, attempt registration, verify 400 Workshop Full
- [x] 10.5 Test webhook mock: POST to `/payments/webhook/mock` with PAYMENT_SUCCEEDED payload, verify Registration → PAID

## 11. Bug Fixes (found during live testing)

- [x] 11.1 Remove custom BullMQ job ID (`reg:${userId}:${workshopId}:${Date.now()}`) from `registrations.service.ts` — BullMQ rejects IDs containing `:`; let BullMQ auto-generate the ID
- [x] 11.2 Add terminal-state guard to the `PAYMENT_SUCCEEDED` branch in `payment-webhook.controller.ts`: change `if (status === PAID)` to `if (status !== HOLDING)` so that late success webhooks on EXPIRED or FAILED registrations are no-ops and cannot cause double-booking
- [x] 11.3 Add terminal-state guard to the `PAYMENT_FAILED / PAYMENT_EXPIRED` branch in `payment-webhook.controller.ts`: return `200` early if `registration.status !== HOLDING` so that late or duplicate failure events cannot release an already-released seat or downgrade a PAID registration
- [x] 11.4 Re-run smoke test suite (`npx tsx test-registration.ts`) and verify all 10 tests pass
