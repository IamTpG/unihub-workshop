## MODIFIED Requirements

### Requirement: Single check-in endpoint
The system SHALL provide functionality for staff or admin users to verify a single attendee QR token and mark the attendee as checked in when eligible.

#### Scenario: Successful check-in
- **WHEN** a staff user sends `POST /api/v1/check-ins/verify` with `{ qrToken, workshopId? }`
- **AND** a registration exists with `qrStub = qrToken`
- **AND** the registration status is `PAID` and `checkedInAt` is null
- **AND** any provided `workshopId` matches the registration workshop
- **THEN** the system updates `checkedInAt` to server time
- **AND** returns `{ success: true, status: "CHECKED_IN", message, studentName, workshopTitle, checkedInAt }`

#### Scenario: Registration already checked in
- **WHEN** a check-in verify request is sent for a QR token whose registration already has a non-null `checkedInAt`
- **THEN** the system returns `{ success: true, status: "ALREADY_CHECKED_IN", message, studentName, workshopTitle, checkedInAt }`
- **AND** the `checkedInAt` value is NOT overwritten

#### Scenario: QR token is invalid
- **WHEN** a check-in verify request is sent with a `qrToken` that does not match any registration `qrStub`
- **THEN** the system returns `{ success: false, status: "INVALID_QR", message: "QR code not recognized" }`

#### Scenario: QR token is for wrong workshop
- **WHEN** a check-in verify request includes `workshopId`
- **AND** the registration found by `qrStub` belongs to a different workshop
- **THEN** the system returns `{ success: false, status: "WRONG_WORKSHOP", message: "Ticket is for a different workshop", workshopTitle }`
- **AND** the registration is not updated

#### Scenario: Registration not in PAID status
- **WHEN** a check-in verify request is sent for a registration with status other than `PAID`
- **THEN** the system returns `{ success: false, status: "NOT_CONFIRMED", message }`
- **AND** the message includes the registration status
- **AND** the registration is not updated

### Requirement: Check-in requires STAFF or ADMIN role
The system SHALL restrict check-in functionality to users with `STAFF` or `ADMIN` role only.

#### Scenario: Access denied for students
- **WHEN** a user with the `STUDENT` role attempts to access the check-in endpoint
- **THEN** the system returns a `403 Forbidden` error
- **AND** the check-in is not processed

#### Scenario: Staff can verify QR
- **WHEN** a user with the `STAFF` role sends `POST /api/v1/check-ins/verify`
- **THEN** the request is allowed to reach check-in verification logic

#### Scenario: Admin can verify QR
- **WHEN** a user with the `ADMIN` role sends `POST /api/v1/check-ins/verify`
- **THEN** the request is allowed to reach check-in verification logic
