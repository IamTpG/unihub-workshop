## ADDED Requirements

### Requirement: Circuit breaker wraps payment provider calls
The system SHALL wrap all calls to `provider.createIntent()` in the registration worker with a circuit breaker that prevents cascading failures when the payment gateway is unavailable.

#### Scenario: Payment gateway responds normally (circuit CLOSED)
- **WHEN** the circuit breaker is in CLOSED state
- **AND** the worker calls `provider.createIntent()`
- **THEN** the call passes through to the payment gateway normally
- **AND** the registration is updated to `HOLDING` with a valid `paymentRef`

#### Scenario: Payment gateway times out (circuit CLOSED, call fails)
- **WHEN** the payment gateway does not respond within 5 seconds
- **THEN** the circuit breaker triggers a timeout error
- **AND** the registration is set to `HOLDING` with `paymentRef: null`
- **AND** a `PAYMENT_RETRY` notification job is enqueued
- **AND** a payment timeout job is scheduled (30-minute expiry safety net)

#### Scenario: Circuit opens after repeated failures
- **WHEN** more than 50% of payment calls fail within the sampling window (minimum 5 calls)
- **THEN** the circuit breaker transitions to OPEN state
- **AND** subsequent payment calls are rejected immediately without contacting the payment gateway (fail fast)

#### Scenario: Circuit breaker in OPEN state (fail fast)
- **WHEN** the circuit breaker is OPEN
- **AND** a new registration job requires payment
- **THEN** the fallback fires immediately (no network call)
- **AND** the registration is set to `HOLDING` with `paymentRef: null`
- **AND** a `PAYMENT_RETRY` notification is enqueued
- **AND** the `GET /workshops` API endpoint remains fully responsive

#### Scenario: Circuit transitions to HALF-OPEN after cooldown
- **WHEN** the circuit has been OPEN for 30 seconds
- **THEN** the circuit transitions to HALF-OPEN
- **AND** one probe request is allowed through to the payment gateway

#### Scenario: Probe request succeeds (HALF-OPEN → CLOSED)
- **WHEN** the circuit is in HALF-OPEN state
- **AND** the probe payment call succeeds
- **THEN** the circuit transitions back to CLOSED
- **AND** subsequent payment calls proceed normally

#### Scenario: Probe request fails (HALF-OPEN → OPEN)
- **WHEN** the circuit is in HALF-OPEN state
- **AND** the probe payment call fails
- **THEN** the circuit transitions back to OPEN
- **AND** the 30-second cooldown timer resets

### Requirement: Browse flow isolation from payment failures
The system SHALL ensure that payment gateway failures do not impact the availability of read-only endpoints such as `GET /workshops` and `GET /workshops/:id`.

#### Scenario: Payment gateway is completely down
- **WHEN** the payment gateway has been unreachable for 5 minutes
- **AND** the circuit breaker is in OPEN state
- **THEN** `GET /workshops` responds with `200 OK` within normal latency
- **AND** `GET /workshops/:id` responds with `200 OK` within normal latency
- **AND** no connection pool exhaustion or event loop blocking occurs in the API process

#### Scenario: Free workshop registration during payment outage
- **WHEN** the payment gateway is down (circuit OPEN)
- **AND** a student registers for a free workshop (price = 0)
- **THEN** the registration completes successfully with status `PAID`
- **AND** the payment circuit breaker is never invoked (free workshops skip payment)
