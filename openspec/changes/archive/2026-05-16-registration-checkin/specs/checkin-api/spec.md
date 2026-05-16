## MODIFIED Requirements

### Requirement: Single check-in endpoint
The system SHALL provide functionality for staff to mark a single attendee as checked in.

#### Scenario: Successful check-in
- **WHEN** a staff user sends a check-in request with a `registrationId` (scanned from the student's QR code)
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
