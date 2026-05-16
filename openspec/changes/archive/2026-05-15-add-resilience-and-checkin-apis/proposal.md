## Why

The system currently handles workshop registration via a BullMQ queue with idempotency protection, but three critical resilience gaps remain before the demo:

1. **No burst protection** — When 12,000 students hit the registration endpoint in the first 3 minutes of opening, there is nothing preventing a single client from monopolizing capacity by spamming requests. The API is fully exposed to abuse.
2. **Payment failures cascade** — The `provider.createIntent()` call in the registration worker is invoked directly with no timeout isolation. If the payment gateway hangs, worker threads stall, blocking the entire registration pipeline. Meanwhile, browse endpoints (`GET /workshops`) share the same Node.js process resources and degrade alongside payment.
3. **No check-in API** — The `checkins` module is empty (`.gitkeep` only). Staff cannot mark attendance at the event. The `checkedInAt` field exists in the `Registration` schema but is unreachable from any endpoint.
4. **Notifications are fire-and-forget** — The `notificationQueue` receives jobs from payment webhooks and registration processors, but no processor consumes them. Frontend has no mechanism to receive real-time status updates.

These are course requirements for demonstrating system resilience under load, failure isolation between subsystems, and a complete event lifecycle (register → pay → check-in → notify).

## What Changes

- **Add rate limiting middleware** backed by Redis (sliding window per user/IP) to protect all API endpoints, with stricter limits on write endpoints (`POST /registrations`)
- **Add circuit breaker** around the payment provider call in the registration worker using `opossum`, so payment gateway failures are isolated and do not block browse or registration queue processing
- **Implement check-in APIs** — `POST /check-ins/batch` for offline-sync batch check-in with dedupe, and `POST /check-ins/:registrationId` for single check-in, both updating `Registration.checkedInAt`
- **Implement SSE notification delivery** — a notification worker processor that publishes to Redis Pub/Sub, and an SSE endpoint in the API that streams events to connected clients
- **Add notification processor** in the worker app to consume the existing `notification-queue` and bridge messages to Redis Pub/Sub channels

## Non-Goals

- WebSocket implementation — SSE is sufficient for one-way push notifications
- Frontend notification UI — only backend delivery mechanism is in scope
- Real payment provider integration — mock provider with circuit breaker wrapper is sufficient for demo
- Mobile push notifications (FCM/APNs) — out of scope, web SSE only

## Capabilities

### New Capabilities
- `rate-limiting`: Redis-backed sliding window rate limiter middleware with per-route configuration
- `circuit-breaker`: Opossum-based circuit breaker wrapping payment provider calls with fallback behavior
- `checkin-api`: Staff check-in endpoints (single + batch) with offline-sync dedupe support
- `sse-notifications`: Server-Sent Events endpoint and notification worker processor for real-time delivery

### Modified Capabilities
_(none — existing specs remain unchanged, these are additive capabilities)_

## Impact

- **API app** (`apps/api`):
  - New middleware: `infra/rate-limit/` (currently empty `.gitkeep`)
  - New module: `modules/checkins/` (currently empty `.gitkeep`)
  - New module: `modules/notifications/` SSE endpoint (currently empty `.gitkeep`)
  - Modified: `infra/circuit-breaker/` (currently empty `.gitkeep`)
- **Worker app** (`apps/worker`):
  - New processor: notification processor consuming `notification-queue`
  - Modified: `registration.processor.ts` — wrap `provider.createIntent()` with circuit breaker
- **Shared package** (`packages/shared`):
  - May need new type definitions for check-in payloads and SSE event types
- **Dependencies**: `opossum` (circuit breaker), `express-rate-limit` + `rate-limit-redis` (rate limiting)
- **Infrastructure**: Requires existing Redis instance (already available)
