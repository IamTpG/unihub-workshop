## ADDED Requirements

### Requirement: Webhook endpoint accepts payment provider callbacks
The system SHALL expose `POST /payments/webhook/:provider` to receive payment lifecycle events. The endpoint SHALL verify the webhook signature using the `PaymentProvider.verifyWebhook` method before processing.

#### Scenario: Valid webhook received
- **WHEN** a webhook POST arrives with a valid signature for the specified provider
- **THEN** the system verifies the signature, identifies the Registration by `paymentIntentId`, and processes the event

#### Scenario: Invalid webhook signature
- **WHEN** a webhook POST arrives with an invalid or missing signature
- **THEN** the system responds `400 { error: "Invalid webhook signature" }` and does not mutate any state

#### Scenario: Unknown provider in path
- **WHEN** a webhook POST arrives with a `:provider` value not in the configured provider registry
- **THEN** the system responds `400 { error: "Unknown provider" }`

### Requirement: Successful payment transitions Registration to PAID
On receiving a `PAYMENT_SUCCEEDED` event, the system SHALL update the Registration to `status: PAID`, generate a QR code stub, and enqueue a success notification job.

#### Scenario: Payment succeeded event processed
- **WHEN** the webhook delivers a `PAYMENT_SUCCEEDED` event for a known `paymentIntentId`
- **THEN** the Registration status is set to `PAID`, a QR stub string is stored, a `notification-queue` job is enqueued, and the endpoint returns `200 OK`

#### Scenario: Payment succeeded for already-PAID registration (idempotent)
- **WHEN** the webhook delivers a `PAYMENT_SUCCEEDED` event and the Registration is already `PAID`
- **THEN** the system returns `200 OK` without creating duplicate records or notifications

#### Scenario: Payment succeeded for a terminal non-HOLDING registration (EXPIRED or FAILED)
- **WHEN** the webhook delivers a `PAYMENT_SUCCEEDED` event and the Registration status is `EXPIRED` or `FAILED`
- **THEN** the system returns `200 OK` without changing the Registration status, without generating a QR stub, and without adjusting `available_slots` in DB or Redis (the seat was already released; resurrecting the registration would produce a double-booking)

### Requirement: Failed or expired payment releases the seat
On receiving a `PAYMENT_FAILED` or `PAYMENT_EXPIRED` event, the system SHALL update Registration status to `FAILED` or `EXPIRED`, increment `available_slots` in DB, increment `workshop:{id}:slots` in Redis, and enqueue a failure notification job.

#### Scenario: Payment failed event processed
- **WHEN** the webhook delivers a `PAYMENT_FAILED` event for a known `paymentIntentId`
- **THEN** the Registration status is set to `FAILED`, `available_slots` is incremented in DB, `workshop:{id}:slots` is incremented in Redis, a failure notification job is enqueued, and the endpoint returns `200 OK`

#### Scenario: Payment expired event processed
- **WHEN** the webhook delivers a `PAYMENT_EXPIRED` event for a known `paymentIntentId`
- **THEN** the Registration status is set to `EXPIRED` and the same seat release + notification logic applies as PAYMENT_FAILED

#### Scenario: Payment failed for a non-HOLDING registration (PAID, FAILED, or EXPIRED)
- **WHEN** the webhook delivers a `PAYMENT_FAILED` or `PAYMENT_EXPIRED` event and the Registration status is anything other than `HOLDING`
- **THEN** the system returns `200 OK` without changing the Registration status, without releasing the seat in DB or Redis, and without enqueuing a notification (prevents seat double-release on duplicate events and prevents downgrading a confirmed PAID registration)

#### Scenario: Unknown paymentIntentId in webhook
- **WHEN** the webhook delivers an event with a `paymentIntentId` that matches no Registration
- **THEN** the system logs a warning and returns `200 OK` (do not retry loop with provider)

### Requirement: Webhook endpoint is idempotency-protected
The webhook endpoint SHALL participate in the idempotency middleware using the provider-supplied event ID as the idempotency key, preventing duplicate processing of replayed webhooks.

#### Scenario: Duplicate webhook delivery
- **WHEN** the same webhook event is delivered a second time (same event ID)
- **THEN** the idempotency middleware returns the cached `200 OK` response without re-processing
