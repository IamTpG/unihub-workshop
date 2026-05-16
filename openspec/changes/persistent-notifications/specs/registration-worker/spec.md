## MODIFIED Requirements

### Requirement: Free workshops skip payment and go directly to PAID
If a workshop has `price == 0`, the Registration SHALL be updated to `status: PAID` immediately after the DB transaction, and a `notification-queue` job SHALL be enqueued with `type: "REGISTRATION_CONFIRMED"`, `title: "Registration Confirmed"`, and `body: "Your spot has been reserved."`.

#### Scenario: Free workshop registration completion
- **WHEN** the worker processes a registration job for a workshop with `price == 0`
- **THEN** the Registration record is created and immediately set to `status: PAID`
- **AND** a notification job is enqueued with `type: "REGISTRATION_CONFIRMED"`, `title: "Registration Confirmed"`, `body: "Your spot has been reserved."`
- **AND** no payment intent is created

### Requirement: Payment confirmed notification is sent on webhook success
When the payment webhook controller confirms a `PAYMENT_SUCCEEDED` event, it SHALL enqueue a notification job with `type: "PAYMENT_SUCCESS"`, `title: "Payment Successful"`, and `body: "Your registration payment has been confirmed."`.

#### Scenario: Payment webhook PAYMENT_SUCCEEDED enqueues notification
- **WHEN** the payment webhook controller processes a `PAYMENT_SUCCEEDED` event for a HOLDING registration
- **THEN** the registration status is updated to `PAID`
- **AND** a notification job is enqueued with `type: "PAYMENT_SUCCESS"`, `title: "Payment Successful"`, `body: "Your registration payment has been confirmed."`

### Requirement: Payment failed notification is sent on webhook failure
When the payment webhook controller processes a `PAYMENT_FAILED` event, it SHALL enqueue a notification job with `type: "PAYMENT_FAILED"`, `title: "Payment Failed"`, and `body: "Your payment could not be processed. Your seat has been released."`.

#### Scenario: Payment webhook PAYMENT_FAILED enqueues notification
- **WHEN** the payment webhook controller processes a `PAYMENT_FAILED` event for a HOLDING registration
- **THEN** the registration status is updated to `FAILED`
- **AND** a notification job is enqueued with `type: "PAYMENT_FAILED"`, `title: "Payment Failed"`, `body: "Your payment could not be processed. Your seat has been released."`

### Requirement: Seat is released if payment times out
The `payment-timeout` processor SHALL check the Registration status after 30 minutes. If still `HOLDING`, it SHALL update status to `EXPIRED`, increment `available_slots` in DB and Redis, and enqueue a notification job with `type: "REGISTRATION_EXPIRED"`, `title: "Reservation Expired"`, `body: "Your seat reservation has expired. Please register again."`.

#### Scenario: Payment timeout fires on a HOLDING registration
- **WHEN** the `payment-timeout` job fires and the Registration status is still `HOLDING`
- **THEN** the Registration status is set to `EXPIRED`
- **AND** `available_slots` is incremented in DB and Redis
- **AND** a notification job is enqueued with `type: "REGISTRATION_EXPIRED"`, `title: "Reservation Expired"`, `body: "Your seat reservation has expired. Please register again."`

#### Scenario: Payment timeout fires on an already PAID registration
- **WHEN** the `payment-timeout` job fires and the Registration status is `PAID`
- **THEN** the job completes with no action (no seat release, no status change, no notification)
