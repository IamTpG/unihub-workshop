# registration-list-api Specification

## Purpose
TBD - created by archiving change my-registrations-screen. Update Purpose after archive.
## Requirements
### Requirement: GET registrations endpoint with status filter
The API SHALL expose `GET /registrations` that returns the authenticated user's registrations. The endpoint SHALL accept an optional `status` query parameter to filter by `RegStatus` values.

#### Scenario: Fetch PAID registrations
- **GIVEN** user "student-1" has 4 PAID registrations and 1 HOLDING registration
- **WHEN** `GET /registrations?status=PAID` is called with a valid JWT for "student-1"
- **THEN** the response status is 200
- **AND** the response body contains exactly 4 registrations
- **AND** each registration includes `id`, `status`, `qrStub`, `paymentRef`, `createdAt`, and nested `workshop` with `title`, `startTime`, `price`

#### Scenario: Fetch Pending registrations
- **GIVEN** user "student-1" has 1 HOLDING registration and 1 FAILED registration
- **WHEN** `GET /registrations?status=HOLDING,PENDING,FAILED,EXPIRED` is called
- **THEN** the response contains 2 registrations
- **AND** each registration includes its respective status and nested workshop data

#### Scenario: Fetch all registrations without filter
- **GIVEN** user "student-1" has 5 total registrations across all statuses
- **WHEN** `GET /registrations` is called without a `status` query parameter
- **THEN** the response contains all 5 registrations

#### Scenario: Unauthenticated request
- **WHEN** `GET /registrations` is called without a valid JWT
- **THEN** the response status is 401

#### Scenario: Invalid status filter
- **WHEN** `GET /registrations?status=INVALID` is called
- **THEN** the response status is 400
- **AND** the response body contains error message "Invalid status filter"

### Requirement: GET single registration by ID
The API SHALL expose `GET /registrations/:id` that returns a single registration belonging to the authenticated user, including nested workshop data.

#### Scenario: Fetch own registration by ID
- **GIVEN** user "student-1" owns registration "reg-123"
- **WHEN** `GET /registrations/reg-123` is called with a valid JWT for "student-1"
- **THEN** the response status is 200
- **AND** the response includes the registration with nested `workshop` data

#### Scenario: Fetch another user's registration
- **GIVEN** registration "reg-456" belongs to "student-2"
- **WHEN** `GET /registrations/reg-456` is called with a valid JWT for "student-1"
- **THEN** the response status is 404

#### Scenario: Registration not found
- **WHEN** `GET /registrations/nonexistent-id` is called
- **THEN** the response status is 404

