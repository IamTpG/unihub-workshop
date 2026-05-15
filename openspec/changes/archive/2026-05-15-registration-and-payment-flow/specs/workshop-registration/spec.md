## ADDED Requirements

### Requirement: Student can register for an open workshop
A STUDENT user SHALL be able to register for a workshop that has available slots by calling `POST /workshops/:id/register` with a valid `x-idempotency-key` header. The system SHALL return `202 Accepted` with a `jobId` when the soft reservation succeeds.

#### Scenario: Successful soft reservation
- **WHEN** a STUDENT posts to `/workshops/:id/register` and the workshop has available slots
- **THEN** the system decrements `workshop:{id}:slots` in Redis atomically, enqueues a job to `registration-queue`, and responds `202 { jobId }`

#### Scenario: Workshop is full (Redis gate)
- **WHEN** a STUDENT posts to `/workshops/:id/register` and Redis DECR returns a value less than 0
- **THEN** the system increments the counter back and responds `400 { error: "Workshop Full" }` without creating any DB record or BullMQ job

#### Scenario: Workshop does not exist
- **WHEN** a STUDENT posts to `/workshops/:id/register` and no workshop with that ID exists
- **THEN** the system responds `404 { error: "Workshop not found" }` without touching Redis

#### Scenario: Workshop is not open for registration
- **WHEN** a STUDENT posts to `/workshops/:id/register` and the workshop status is not `OPEN`
- **THEN** the system responds `400 { error: "Workshop is not open for registration" }`

### Requirement: Non-student users cannot register
Only users with role `STUDENT` SHALL be permitted to call the registration endpoint.

#### Scenario: Admin attempts to register
- **WHEN** a user with role `ADMIN` posts to `/workshops/:id/register`
- **THEN** the system responds `403 Forbidden`

#### Scenario: Unauthenticated request
- **WHEN** a request to `/workshops/:id/register` has no valid JWT
- **THEN** the system responds `401 Unauthorized`

### Requirement: Missing idempotency key is rejected
The `POST /workshops/:id/register` endpoint SHALL require the `x-idempotency-key` header.

#### Scenario: Request without idempotency key
- **WHEN** a STUDENT posts to `/workshops/:id/register` without the `x-idempotency-key` header
- **THEN** the system responds `400 { error: "x-idempotency-key header is required" }`
