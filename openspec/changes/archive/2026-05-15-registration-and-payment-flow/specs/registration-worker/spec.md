## ADDED Requirements

### Requirement: Worker commits seat atomically in DB
The registration worker SHALL process jobs from `registration-queue` with concurrency 1000. For each job, it SHALL attempt an atomic update `available_slots = available_slots - 1 WHERE available_slots > 0` on the Workshop row within a Prisma transaction.

#### Scenario: Successful DB seat commit
- **WHEN** the worker processes a job and `available_slots > 0` in DB
- **THEN** the worker decrements `available_slots`, creates a `Registration` record with `status: PENDING`, and proceeds to payment initiation

#### Scenario: DB seat conflict (race condition)
- **WHEN** the worker processes a job and the atomic UPDATE matches 0 rows (no seats left)
- **THEN** the worker increments `workshop:{id}:slots` in Redis back by 1, does NOT create a Registration record, and marks the job as failed

#### Scenario: Prisma transaction failure
- **WHEN** a DB error occurs during the transaction (deadlock, timeout)
- **THEN** the transaction is rolled back, the job is retried up to 3 times with exponential backoff, and Redis counter is only incremented after all retries are exhausted

### Requirement: Free workshops skip payment and go directly to PAID
If a workshop has `price == 0`, the Registration SHALL be updated to `status: PAID` immediately after the DB transaction, and a `notification-queue` job SHALL be enqueued.

#### Scenario: Free workshop registration completion
- **WHEN** the worker processes a registration job for a workshop with `price == 0`
- **THEN** the Registration record is created and immediately set to `status: PAID`, and a notification job is enqueued — no payment intent is created

### Requirement: Paid workshops initiate a payment intent and enter HOLDING
If a workshop has `price > 0`, the worker SHALL call `PaymentProvider.createIntent` and update the Registration to `status: HOLDING` with the `paymentIntentId` and `expiresAt = now + 30 minutes`.

#### Scenario: Payment intent created successfully
- **WHEN** the worker processes a registration job for a workshop with `price > 0` and the payment provider responds successfully
- **THEN** the Registration is updated to `status: HOLDING`, `paymentIntentId` is stored, `expiresAt` is set to 30 minutes from now, and a `payment-timeout` delayed job is enqueued

#### Scenario: Payment provider unavailable (circuit breaker)
- **WHEN** the worker calls `PaymentProvider.createIntent` and it throws an error
- **THEN** the worker logs the error, sets Registration to `status: HOLDING` with no `paymentIntentId`, enqueues a `payment-timeout` job (30-minute delay), and the student is notified to retry payment within 30 minutes

### Requirement: Seat is released if payment times out
The `payment-timeout` processor SHALL check the Registration status after 30 minutes. If still `HOLDING`, it SHALL update status to `EXPIRED`, increment `available_slots` in DB and Redis.

#### Scenario: Payment timeout fires on a HOLDING registration
- **WHEN** the `payment-timeout` job fires and the Registration status is still `HOLDING`
- **THEN** the Registration status is set to `EXPIRED`, `available_slots` is incremented in DB, `workshop:{id}:slots` is incremented in Redis, and a failure notification job is enqueued

#### Scenario: Payment timeout fires on an already PAID registration
- **WHEN** the `payment-timeout` job fires and the Registration status is `PAID`
- **THEN** the job completes with no action (no seat release, no status change)
