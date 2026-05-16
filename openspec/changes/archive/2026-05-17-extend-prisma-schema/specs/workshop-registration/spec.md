## ADDED Requirements

### Requirement: Workshop has optional registration window
A `Workshop` SHALL optionally carry `registrationOpenAt` and `registrationCloseAt` timestamps. When both are set, registration requests outside this window SHALL be rejected.

#### Scenario: Registration before window opens
- **WHEN** a STUDENT posts to `/workshops/:id/register` and the current time is before `registrationOpenAt`
- **THEN** the system responds `400 { error: "Registration is not open yet" }` without touching Redis or creating a DB record

#### Scenario: Registration after window closes
- **WHEN** a STUDENT posts to `/workshops/:id/register` and the current time is after `registrationCloseAt`
- **THEN** the system responds `400 { error: "Registration is closed" }` without touching Redis or creating a DB record

#### Scenario: No window set — registration always open (status-permitting)
- **WHEN** a Workshop has `registrationOpenAt = NULL` and `registrationCloseAt = NULL`
- **THEN** the time-gate check is skipped and existing status/slot logic applies unchanged

## MODIFIED Requirements

### Requirement: Student can register for an open workshop
A STUDENT user SHALL be able to register for a workshop that has available slots by calling `POST /workshops/:id/register` with a valid `x-idempotency-key` header. The system SHALL return `202 Accepted` with a `jobId` when the soft reservation succeeds. If the workshop has a registration window configured, the request time SHALL fall within that window.

#### Scenario: Successful soft reservation
- **WHEN** a STUDENT posts to `/workshops/:id/register` and the workshop has available slots and the current time is within any configured registration window
- **THEN** the system decrements `workshop:{id}:slots` in Redis atomically, enqueues a job to `registration-queue`, and responds `202 { jobId }`

#### Scenario: Workshop is full (Redis gate)
- **WHEN** a STUDENT posts to `/workshops/:id/register` and Redis DECR returns a value less than 0
- **THEN** the system increments the counter back and responds `400 { error: "Workshop Full" }` without creating any DB record or BullMQ job

#### Scenario: Workshop does not exist
- **WHEN** a STUDENT posts to `/workshops/:id/register` and no workshop with that ID exists
- **THEN** the system responds `404 { error: "Workshop not found" }` without touching Redis

#### Scenario: Workshop is not open for registration
- **WHEN** a STUDENT posts to `/workshops/:id/register` and the workshop status is not `PUBLISHED`
- **THEN** the system responds `400 { error: "Workshop is not open for registration" }`

## ADDED Requirements

### Requirement: Registration can be cancelled
A registration SHALL support a `CANCELLED` status in addition to existing statuses. The `CANCELLED` status indicates an intentional cancellation distinct from `FAILED` (system error) or `EXPIRED` (timeout).

#### Scenario: Registration marked as cancelled
- **WHEN** a registration is explicitly cancelled by the student or an admin
- **THEN** the registration row has `status = "CANCELLED"` and is not counted as an active reservation

#### Scenario: Cancelled registration does not block re-registration
- **WHEN** a student's prior registration for a workshop is in `CANCELLED` status
- **THEN** the unique constraint on `(userId, workshopId)` does not prevent a new registration attempt (handled at application layer by deleting or updating the cancelled row)
