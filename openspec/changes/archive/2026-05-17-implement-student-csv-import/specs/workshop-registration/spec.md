## MODIFIED Requirements

### Requirement: Student can register for an open workshop
A STUDENT user SHALL be able to register for a workshop that has available slots by calling `POST /workshops/:id/register` with a valid `x-idempotency-key` header only when the student's email exists in `StudentRecord` with `status = "ACTIVE"`. The system SHALL return `202 Accepted` with a `jobId` when the soft reservation succeeds. If the workshop has a registration window configured, the request time SHALL fall within this window.

#### Scenario: Successful soft reservation
- **WHEN** a STUDENT with an ACTIVE imported student record posts to `/workshops/:id/register` and the workshop has available slots and the current time is within any configured registration window
- **THEN** the system decrements `workshop:{id}:slots` in Redis atomically, enqueues a job to `registration-queue`, and responds `202 { jobId }`

#### Scenario: Student record is missing or inactive
- **WHEN** a STUDENT posts to `/workshops/:id/register` and their email has no ACTIVE `StudentRecord`
- **THEN** the system responds `403 Forbidden` with message `"Your student record is not active. Please contact admin."`
- **AND** the system does not decrement Redis slots, create a registration, or enqueue a registration job

#### Scenario: Workshop is full (Redis gate)
- **WHEN** a STUDENT with an ACTIVE imported student record posts to `/workshops/:id/register` and Redis DECR returns a value less than 0
- **THEN** the system increments the counter back and responds `400 { error: "Workshop Full" }` without creating any DB record or BullMQ job

#### Scenario: Workshop does not exist
- **WHEN** a STUDENT posts to `/workshops/:id/register` and no workshop with that ID exists
- **THEN** the system responds `404 { error: "Workshop not found" }` without touching Redis

#### Scenario: Workshop is not open for registration
- **WHEN** a STUDENT posts to `/workshops/:id/register` and the workshop status is not `PUBLISHED`
- **THEN** the system responds `400 { error: "Workshop is not open for registration" }`
