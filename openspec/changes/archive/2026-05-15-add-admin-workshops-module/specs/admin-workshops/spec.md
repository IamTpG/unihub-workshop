## ADDED Requirements

### Requirement: Admin workshop routes are protected
The system SHALL expose admin workshop routes only to authenticated users whose role is allowed by the RBAC middleware.

#### Scenario: Admin accesses workshop management
- **GIVEN** an authenticated user has the `ADMIN` role
- **WHEN** the user calls an `/admin/workshops` endpoint
- **THEN** the request is allowed to reach the admin workshop controller

#### Scenario: Non-admin user is forbidden
- **GIVEN** an authenticated user has the `STUDENT` role
- **WHEN** the user calls an `/admin/workshops` endpoint
- **THEN** the system returns a 403 Forbidden response

#### Scenario: Unauthenticated request is rejected
- **GIVEN** no authenticated user is available on the request
- **WHEN** the request calls an `/admin/workshops` endpoint
- **THEN** the system returns an authentication error before executing workshop logic

### Requirement: Admin can create workshops
The system SHALL allow an admin to create a workshop through `POST /admin/workshops` using Prisma persistence.

#### Scenario: Workshop is created with available slots initialized
- **GIVEN** an authenticated admin submits valid workshop details including `capacity`
- **WHEN** the admin calls `POST /admin/workshops`
- **THEN** the system creates a workshop record
- **AND** the stored `availableSlots` equals the submitted `capacity`

#### Scenario: Workshop stores uploaded asset URLs
- **GIVEN** an authenticated admin submits valid `roomLayoutUrl` and `pdfUrl` string values
- **WHEN** the admin calls `POST /admin/workshops`
- **THEN** the system stores both URL values on the workshop record

#### Scenario: Invalid create payload is rejected
- **GIVEN** an authenticated admin submits an invalid workshop payload
- **WHEN** the admin calls `POST /admin/workshops`
- **THEN** the system returns a validation error
- **AND** no workshop record is created

### Requirement: PDF creation triggers AI summary queue
The system SHALL enqueue an AI summary job after creating a workshop when `pdfUrl` is present.

#### Scenario: AI summary job is queued after create
- **GIVEN** an authenticated admin creates a workshop with `pdfUrl`
- **WHEN** the workshop record is saved successfully
- **THEN** the system adds a job to `ai-summary-queue`
- **AND** the job payload contains `{ workshopId, pdfUrl }`

#### Scenario: AI summary job is not queued without PDF
- **GIVEN** an authenticated admin creates a workshop without `pdfUrl`
- **WHEN** the workshop record is saved successfully
- **THEN** the system does not add an AI summary job

#### Scenario: Queue failure is isolated from persistence
- **GIVEN** a workshop is saved successfully with `pdfUrl`
- **WHEN** the AI summary queue is unavailable or times out
- **THEN** the workshop record remains persisted
- **AND** the system reports the enqueue failure through the API error path

### Requirement: Admin can list workshops with pagination
The system SHALL allow an admin to list workshops through `GET /admin/workshops` with pagination metadata.

#### Scenario: Paginated workshop list is returned
- **GIVEN** an authenticated admin provides valid pagination query parameters
- **WHEN** the admin calls `GET /admin/workshops`
- **THEN** the system returns workshop items for the requested page
- **AND** the response includes pagination metadata with total count, page, limit, and total pages

#### Scenario: Default pagination is applied
- **GIVEN** an authenticated admin omits pagination query parameters
- **WHEN** the admin calls `GET /admin/workshops`
- **THEN** the system returns the first page using default pagination values

#### Scenario: Invalid pagination is rejected
- **GIVEN** an authenticated admin provides invalid pagination query parameters
- **WHEN** the admin calls `GET /admin/workshops`
- **THEN** the system returns a validation error

### Requirement: Admin can view workshop details
The system SHALL allow an admin to retrieve a single workshop through `GET /admin/workshops/:id`.

#### Scenario: Workshop details are returned
- **GIVEN** an authenticated admin requests an existing workshop
- **WHEN** the admin calls `GET /admin/workshops/:id`
- **THEN** the system returns the workshop details

#### Scenario: Missing workshop detail returns not found
- **GIVEN** an authenticated admin requests a workshop ID that does not exist
- **WHEN** the admin calls `GET /admin/workshops/:id`
- **THEN** the system returns a not found error

### Requirement: Admin can update workshops
The system SHALL allow an admin to update workshop details through `PUT /admin/workshops/:id` using Prisma persistence.

#### Scenario: Workshop details are updated
- **GIVEN** an authenticated admin submits valid updates for an existing workshop
- **WHEN** the admin calls `PUT /admin/workshops/:id`
- **THEN** the system updates the matching workshop record
- **AND** returns the updated workshop

#### Scenario: Updating PDF triggers AI summary queue
- **GIVEN** an authenticated admin submits a valid `pdfUrl` update for an existing workshop
- **WHEN** the workshop update is saved successfully
- **THEN** the system adds a job to `ai-summary-queue`
- **AND** the job payload contains `{ workshopId, pdfUrl }`

#### Scenario: Missing workshop update returns not found
- **GIVEN** an authenticated admin submits valid updates for a workshop ID that does not exist
- **WHEN** the admin calls `PUT /admin/workshops/:id`
- **THEN** the system returns a not found error

### Requirement: Admin can view workshop stats
The system SHALL allow an admin to retrieve workshop details with registration counts through `GET /admin/workshops/:id/stats`.

#### Scenario: Workshop stats are returned
- **GIVEN** an authenticated admin requests stats for an existing workshop
- **WHEN** the admin calls `GET /admin/workshops/:id/stats`
- **THEN** the system returns the workshop details
- **AND** the response includes registration counts grouped by registration status
- **AND** the response includes a total registration count

#### Scenario: Missing workshop stats returns not found
- **GIVEN** an authenticated admin requests stats for a workshop ID that does not exist
- **WHEN** the admin calls `GET /admin/workshops/:id/stats`
- **THEN** the system returns a not found error
