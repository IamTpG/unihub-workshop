## 1. Rate Limiting (Developer A — Evening 1)

- [x] 1.1 Install `express-rate-limit` and `rate-limit-redis` in `apps/api`
- [x] 1.2 Create `apps/api/src/infra/rate-limit/rate-limiter.ts` — factory function that creates rate limiter middleware with Redis store, accepting `windowMs`, `max`, and optional `keyGenerator` parameters
- [x] 1.3 Create `apps/api/src/infra/rate-limit/index.ts` — export pre-configured limiters: `globalLimiter` (100 req/60s per IP), `authLimiter` (5 req/60s per IP), `registrationLimiter` (10 req/60s per userId)
- [x] 1.4 Wire `globalLimiter` into `app.ts` as top-level middleware
- [x] 1.5 Wire `authLimiter` into auth routes (`POST /auth/request-otp`)
- [x] 1.6 Wire `registrationLimiter` into registration routes (`POST /workshops/:id/register`)
- [x] 1.7 Add role-based tier support: if `req.user.role` is STAFF or ADMIN, apply 200 req/60s limit instead of 100
- [x] 1.8 Verify: send rapid requests via curl/Postman, confirm `429` response with `Retry-After` header after exceeding limit

## 2. Circuit Breaker (Developer A — Evening 1)

- [x] 2.1 Install `opossum` in `apps/worker`
- [x] 2.2 Create `apps/worker/src/infra/circuit-breaker.ts` — export a configured `CircuitBreaker` instance wrapping a generic async function, with `timeout: 5000`, `errorThresholdPercentage: 50`, `resetTimeout: 30000`, `volumeThreshold: 5`
- [x] 2.3 Create `apps/worker/src/infra/payment-breaker.ts` — import circuit breaker and wrap `provider.createIntent()`, add fallback that returns `{ intentId: undefined }` and logs circuit state
- [x] 2.4 Modify `apps/worker/src/processors/registration.processor.ts` — replace direct `provider.createIntent()` call (lines 82-94) with `paymentBreaker.fire(amount, currency, metadata)`. Existing fallback logic (lines 96-124) already handles `intentId` being undefined, so minimal changes needed
- [x] 2.5 Add circuit breaker event logging: `on('open')`, `on('halfOpen')`, `on('close')` for observability
- [x] 2.6 Verify: modify mock provider to simulate failures, observe circuit state transitions in worker logs, confirm `GET /workshops` remains responsive during payment outage

## 3. Check-in API (Developer B — Evening 1)

- [x] 3.1 Create `apps/api/src/modules/checkins/checkins.schema.ts` — Zod schemas for single check-in params and batch check-in body (array of `{ registrationId, checkedInAt? }`, max 100 items)
- [x] 3.2 Create `apps/api/src/modules/checkins/checkins.repository.ts` — `checkInSingle(registrationId, checkedInAt)` using `prisma.registration.updateMany` with `WHERE id = X AND checked_in_at IS NULL AND status = 'PAID'`, and `checkInBatch(items)` using `prisma.$transaction` wrapping multiple `updateMany` calls
- [x] 3.3 Create `apps/api/src/modules/checkins/checkins.service.ts` — business logic layer: validate registration exists, call repository, compute `{ processedCount, skippedCount, failedIds }` from update results, optionally enqueue notification jobs
- [x] 3.4 Create `apps/api/src/modules/checkins/checkins.controller.ts` — `checkInSingle(req, res)` and `checkInBatch(req, res)` handlers
- [x] 3.5 Create `apps/api/src/modules/checkins/checkins.routes.ts` — `POST /check-ins/:registrationId` and `POST /check-ins/batch`, protected by `authMiddleware` + `rbac(['STAFF', 'ADMIN'])`
- [x] 3.6 Register check-in routes in `apps/api/src/routes/`
- [x] 3.7 Verify: test single check-in, batch check-in, duplicate submission (idempotent), unauthorized student access (403), non-PAID registration (400)

## 4. SSE Notification Delivery (Developer B — Evening 2)

- [x] 4.1 Create `apps/worker/src/processors/notification.processor.ts` — consume `notification-queue`, publish JSON payload to Redis Pub/Sub channel `notifications:user:<userId>`
- [x] 4.2 Register notification processor in `apps/worker/src/main.ts`
- [x] 4.3 Create `apps/api/src/modules/notifications/notifications.sse.ts` — SSE endpoint handler: set headers (`Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`), subscribe to Redis Pub/Sub `notifications:user:<userId>`, write events as `data: ${JSON.stringify(payload)}\n\n`, send keepalive comment every 30s, cleanup on `res.on('close')`
- [x] 4.4 Create `apps/api/src/modules/notifications/notifications.routes.ts` — `GET /notifications/stream` protected by `authMiddleware`
- [x] 4.5 Register notification routes in `apps/api/src/routes/`
- [x] 4.6 Add SSE event type definitions to `packages/shared` — `NotificationEventType` and `SSENotificationPayload` types
- [x] 4.7 Verify: open SSE connection in browser DevTools (`EventSource`), trigger a registration, confirm notification event arrives in real time. Test disconnect/reconnect cleanup.

## 5. Integration Testing (Both — Evening 2)

- [x] 5.1 End-to-end test: register for workshop → rate limiter allows → worker processes → payment circuit breaker handles mock payment → notification delivered via SSE
- [x] 5.2 Resilience test: simulate payment gateway down → confirm circuit opens → confirm `GET /workshops` unaffected → confirm circuit half-opens after 30s
- [x] 5.3 Check-in test: create PAID registration → single check-in → verify `checkedInAt` set → retry same check-in → verify idempotent (skipped)
- [x] 5.4 Burst test: send 20 rapid registration requests → confirm rate limiter returns 429 after threshold
