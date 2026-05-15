## ADDED Requirements

### Requirement: Single check-in endpoint
The system SHALL provide functionality for staff to mark a single attendee as checked in.

#### Scenario: Successful check-in
- **WHEN** a staff user sends a check-in request with a valid registration ID
- **AND** the registration status is `PAID` and `checkedInAt` is null
- **THEN** the system updates `checkedInAt` to the provided timestamp (or server time if not provided)
- **AND** returns the updated registration data

#### Scenario: Registration already checked in
- **WHEN** a check-in request is sent for an ID that already has a non-null `checkedInAt`
- **THEN** the system returns success with the existing data (idempotent)
- **AND** the `checkedInAt` value is NOT overwritten

#### Scenario: Registration not in PAID status
- **WHEN** a check-in request is sent for a registration with status other than `PAID`
- **THEN** the system returns an error "Registration is not eligible for check-in"

### Requirement: Batch check-in endpoint for offline sync
The system SHALL provide a batch endpoint for staff to sync multiple offline check-ins in a single request.

#### Scenario: Successful batch check-in
- **WHEN** a staff user sends a batch of check-in records
- **AND** all registrations are valid and eligible
- **THEN** all registrations are updated within a single database transaction
- **AND** the response includes counts of processed and skipped records

#### Scenario: Batch size limit
- **WHEN** a staff user sends a batch exceeding the maximum allowed size (e.g., 100 records)
- **THEN** the system returns a validation error

### Requirement: Check-in requires STAFF or ADMIN role
The system SHALL restrict check-in functionality to users with `STAFF` or `ADMIN` role only.
