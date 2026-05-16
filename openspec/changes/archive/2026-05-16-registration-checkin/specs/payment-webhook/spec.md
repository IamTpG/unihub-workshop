## MODIFIED Requirements

### Requirement: Successful payment transitions Registration to PAID
On receiving a `PAYMENT_SUCCEEDED` event, the system SHALL update the Registration to `status: PAID`, generate a QR code stub, and enqueue a success notification job.

#### Scenario: Payment succeeded event processed
- **WHEN** the webhook delivers a `PAYMENT_SUCCEEDED` event for a known `paymentIntentId`
- **THEN** the Registration status is set to `PAID`
- **AND** the `qrStub` field is set strictly to the `registrationId`
- **AND** a `notification-queue` job is enqueued
- **AND** the endpoint returns `200 OK`

#### Scenario: Payment succeeded for already-PAID registration (idempotent)
- **WHEN** the webhook delivers a `PAYMENT_SUCCEEDED` event and the Registration is already `PAID`
- **THEN** the system returns `200 OK` without creating duplicate records or notifications

#### Scenario: Payment succeeded for a terminal non-HOLDING registration (EXPIRED or FAILED)
- **WHEN** the webhook delivers a `PAYMENT_SUCCEEDED` event and the Registration status is `EXPIRED` or `FAILED`
- **THEN** the system returns `200 OK` without changing the Registration status, without generating a QR stub, and without adjusting `available_slots` in DB or Redis (the seat was already released; resurrecting the registration would produce a double-booking)
