## ADDED Requirements

### Requirement: Workshop carries optional registration window timestamps
A `Workshop` record SHALL optionally store `registrationOpenAt` and `registrationCloseAt` as nullable UTC timestamps. When either field is `NULL`, the corresponding boundary is treated as unrestricted.

#### Scenario: Workshop created without registration window
- **WHEN** an admin creates a workshop without providing `registrationOpenAt` or `registrationCloseAt`
- **THEN** both fields are stored as `NULL` in the database
- **AND** no time restriction applies to registrations for that workshop

#### Scenario: Workshop created with full registration window
- **WHEN** an admin creates a workshop providing both `registrationOpenAt` and `registrationCloseAt`
- **THEN** both values are stored as UTC timestamps in the database
- **AND** the registration service enforces the window on every registration attempt

#### Scenario: Workshop created with only registrationCloseAt
- **WHEN** an admin creates a workshop providing only `registrationCloseAt`
- **THEN** `registrationOpenAt` is stored as `NULL`
- **AND** registrations are accepted from any time up to `registrationCloseAt`

#### Scenario: Workshop created with only registrationOpenAt
- **WHEN** an admin creates a workshop providing only `registrationOpenAt`
- **THEN** `registrationCloseAt` is stored as `NULL`
- **AND** registrations are accepted from `registrationOpenAt` onward with no closing boundary

### Requirement: Admin schema validates registration window constraints
The admin workshop create and update schemas SHALL enforce cross-field constraints on the registration window.

#### Scenario: registrationOpenAt after registrationCloseAt is rejected
- **WHEN** an admin submits a payload where `registrationOpenAt` is equal to or after `registrationCloseAt`
- **THEN** the system rejects the payload with a 400 validation error before touching the database
- **AND** the error message identifies the constraint violation

#### Scenario: registrationCloseAt after workshop endTime is rejected
- **WHEN** an admin submits a payload where `registrationCloseAt` is after `endTime`
- **THEN** the system rejects the payload with a 400 validation error before touching the database
- **AND** the error message identifies the constraint violation

#### Scenario: Valid partial window passes validation
- **WHEN** an admin submits a payload with only one of the two window fields set and no constraint is violated
- **THEN** the system accepts the payload and persists the record

### Requirement: Public workshop API exposes registration window fields
The `GET /workshops` list endpoint and `GET /workshops/:id` detail endpoint SHALL include `registrationOpenAt` and `registrationCloseAt` in their responses.

#### Scenario: List response includes window fields
- **WHEN** a student calls `GET /workshops`
- **THEN** each item in the response includes `registrationOpenAt` (ISO 8601 string or `null`) and `registrationCloseAt` (ISO 8601 string or `null`)

#### Scenario: Detail response includes window fields
- **WHEN** a student calls `GET /workshops/:id`
- **THEN** the response includes `registrationOpenAt` (ISO 8601 string or `null`) and `registrationCloseAt` (ISO 8601 string or `null`)
