## ADDED Requirements

### Requirement: Single check-in endpoint
The system SHALL provide `POST /api/v1/check-ins/:registrationId` for staff to mark a single attendee as checked in.

#### Scenario: Successful check-in
- **WHEN** a staff user sends `POST /check-ins/:registrationId` with a valid registration ID
- **AND** the registration status is `PAID` and `checkedInAt` is null
- **THEN** the system updates `checkedInAt` to the provided timestamp (or server time if not provided)
- **AND** returns `200 OK` with the updated registration data

#### Scenario: Registration already checked in
- **WHEN** a staff user sends `POST /check-ins/:registrationId`
- **AND** the registration already has a non-null `checkedInAt`
- **THEN** the system returns `200 OK` with the existing data (idempotent, no error)
- **AND** the `checkedInAt` value is NOT overwritten

#### Scenario: Registration not in PAID status
- **WHEN** a staff user sends `POST /check-ins/:registrationId`
- **AND** the registration status is `PENDING`, `HOLDING`, `FAILED`, or `EXPIRED`
- **THEN** the system returns `400 Bad Request` with message "Registration is not eligible for check-in"

#### Scenario: Registration not found
- **WHEN** a staff user sends `POST /check-ins/:registrationId` with a non-existent ID
- **THEN** the system returns `404 Not Found`

#### Scenario: Unauthorized role
- **WHEN** a user with `STUDENT` role sends `POST /check-ins/:registrationId`
- **THEN** the system returns `403 Forbidden`

### Requirement: Batch check-in endpoint for offline sync
The system SHALL provide `POST /api/v1/check-ins/batch` for staff to sync multiple offline check-ins in a single request.

#### Scenario: Successful batch check-in
- **WHEN** a staff user sends a batch of 10 check-in records
- **AND** all 10 registrations are in `PAID` status with null `checkedInAt`
- **THEN** all 10 registrations are updated within a single database transaction
- **AND** the response includes `{ processedCount: 10, skippedCount: 0, failedIds: [] }`

#### Scenario: Batch with mixed results (dedupe)
- **WHEN** a staff user sends a batch of 5 check-in records
- **AND** 3 are valid (PAID, not yet checked in), 1 is already checked in, 1 has status FAILED
- **THEN** 3 registrations are updated
- **AND** the response includes `{ processedCount: 3, skippedCount: 1, failedIds: ["<id-of-failed>"] }`

#### Scenario: Duplicate batch submission (network retry)
- **WHEN** the same batch is submitted twice due to a network timeout and client retry
- **THEN** the first submission processes normally
- **AND** the second submission returns `{ processedCount: 0, skippedCount: 5, failedIds: [] }` because all records already have `checkedInAt` set
- **AND** no data corruption or duplicate entries occur

#### Scenario: Batch size limit
- **WHEN** a staff user sends a batch with more than 100 check-in records
- **THEN** the system returns `400 Bad Request` with message "Batch size exceeds maximum of 100"

#### Scenario: Client-provided timestamps are preserved
- **WHEN** a staff user sends a check-in with `checkedInAt: "2026-05-15T08:00:00Z"`
- **AND** the server receives the request at `2026-05-15T11:00:00Z`
- **THEN** the registration's `checkedInAt` is set to `2026-05-15T08:00:00Z` (client timestamp)

### Requirement: Check-in requires STAFF or ADMIN role
The system SHALL restrict check-in endpoints to users with `STAFF` or `ADMIN` role only.

#### Scenario: Admin performs check-in
- **WHEN** an admin user sends a check-in request
- **THEN** the request is processed normally

#### Scenario: Student attempts check-in
- **WHEN** a student user sends a check-in request
- **THEN** the system returns `403 Forbidden`
