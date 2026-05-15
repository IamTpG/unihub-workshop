## ADDED Requirements

### Requirement: Write endpoints require an idempotency key header
All write endpoints protected by the idempotency middleware SHALL require the `x-idempotency-key` header. Requests without this header SHALL be rejected.

#### Scenario: Request missing the header
- **WHEN** a write request arrives without the `x-idempotency-key` header
- **THEN** the middleware responds `400 { error: "x-idempotency-key header is required" }` before reaching the route handler

### Requirement: In-progress requests are rejected with 409
When a request with a given idempotency key is currently being processed, subsequent requests with the same key SHALL receive a `409` response.

#### Scenario: Concurrent duplicate request
- **WHEN** a second request arrives with the same `x-idempotency-key` while the first request is still IN_PROGRESS in Redis
- **THEN** the middleware responds `409 { error: "Request with this idempotency key is already in progress" }`

### Requirement: Completed requests return the cached response
When a request with a given idempotency key has already completed, subsequent requests with the same key SHALL receive the original response without re-executing the handler.

#### Scenario: Retry of a completed request
- **WHEN** a request arrives with an `x-idempotency-key` that maps to a completed (DONE) entry in Redis
- **THEN** the middleware returns the original response body and status code without invoking the route handler

### Requirement: New keys are marked IN_PROGRESS then DONE atomically
The middleware SHALL use Redis SET NX to claim a key as `IN_PROGRESS` before invoking the handler, and update it to `DONE:{responsePayload}` after the handler completes successfully. TTL for both states SHALL be 24 hours.

#### Scenario: First request with a new key
- **WHEN** a request arrives with a new `x-idempotency-key` not present in Redis
- **THEN** Redis stores the key as `IN_PROGRESS` (TTL 24 h), the route handler executes, and on completion Redis stores the key as `DONE:{response}` (TTL 24 h)

#### Scenario: Handler throws an error
- **WHEN** the route handler throws an unhandled error
- **THEN** the middleware deletes the `IN_PROGRESS` key from Redis so the client can retry with the same idempotency key

### Requirement: Middleware is generic and reusable
The idempotency middleware SHALL be a standalone Express middleware factory, applicable to any route without modification.

#### Scenario: Applied to a new route
- **WHEN** the middleware is attached to any POST route
- **THEN** it enforces idempotency using the `x-idempotency-key` header with no route-specific configuration required
