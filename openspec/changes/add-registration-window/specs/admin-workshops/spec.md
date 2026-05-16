## MODIFIED Requirements

### Requirement: Admin can create workshops
The system SHALL allow an admin to create a workshop through `POST /admin/workshops` using Prisma persistence. The create payload SHALL accept optional `registrationOpenAt` and `registrationCloseAt` datetime fields. When both are provided, `registrationOpenAt` MUST be before `registrationCloseAt`. When `registrationCloseAt` is provided, it MUST be before or equal to `endTime`. Both fields SHALL be persisted to the database when present.

#### Scenario: Workshop is created with available slots initialized
- **GIVEN** an authenticated admin submits valid workshop details including `capacity`
- **WHEN** the admin calls `POST /admin/workshops`
- **THEN** the system creates a workshop record
- **AND** the stored `availableSlots` equals the submitted `capacity`

#### Scenario: Workshop stores uploaded asset URLs
- **GIVEN** an authenticated admin submits valid `roomLayoutUrl` and `pdfUrl` string values
- **WHEN** the admin calls `POST /admin/workshops`
- **THEN** the system stores both URL values on the workshop record

#### Scenario: Workshop is created with a registration window
- **GIVEN** an authenticated admin submits valid workshop details including both `registrationOpenAt` and `registrationCloseAt` where open is before close and close is before or equal to `endTime`
- **WHEN** the admin calls `POST /admin/workshops`
- **THEN** the system persists both window timestamps on the workshop record

#### Scenario: Workshop is created with partial registration window
- **GIVEN** an authenticated admin submits valid workshop details including only `registrationCloseAt` (no `registrationOpenAt`) where close is before or equal to `endTime`
- **WHEN** the admin calls `POST /admin/workshops`
- **THEN** the system persists `registrationCloseAt` and stores `NULL` for `registrationOpenAt`

#### Scenario: Registration window open after close is rejected on create
- **GIVEN** an authenticated admin submits a create payload where `registrationOpenAt` is after or equal to `registrationCloseAt`
- **WHEN** the admin calls `POST /admin/workshops`
- **THEN** the system returns a 400 validation error
- **AND** no workshop record is created

#### Scenario: registrationCloseAt after endTime is rejected on create
- **GIVEN** an authenticated admin submits a create payload where `registrationCloseAt` is after `endTime`
- **WHEN** the admin calls `POST /admin/workshops`
- **THEN** the system returns a 400 validation error
- **AND** no workshop record is created

#### Scenario: Invalid create payload is rejected
- **GIVEN** an authenticated admin submits an invalid workshop payload
- **WHEN** the admin calls `POST /admin/workshops`
- **THEN** the system returns a validation error
- **AND** no workshop record is created

### Requirement: Admin can update workshops
The system SHALL allow an admin to update workshop details through `PUT /admin/workshops/:id` using Prisma persistence. The update payload SHALL accept optional `registrationOpenAt` and `registrationCloseAt` datetime fields. The same cross-field constraints as create SHALL apply. Both fields SHALL be persisted when present in the update payload.

#### Scenario: Workshop details are updated
- **GIVEN** an authenticated admin submits valid updates for an existing workshop
- **WHEN** the admin calls `PUT /admin/workshops/:id`
- **THEN** the system updates the matching workshop record
- **AND** returns the updated workshop

#### Scenario: Registration window is updated
- **GIVEN** an authenticated admin submits an update with valid `registrationOpenAt` and `registrationCloseAt`
- **WHEN** the admin calls `PUT /admin/workshops/:id`
- **THEN** the system persists the updated window timestamps on the workshop record

#### Scenario: Registration window is cleared on update
- **GIVEN** an authenticated admin submits an update with `registrationOpenAt: null` and `registrationCloseAt: null`
- **WHEN** the admin calls `PUT /admin/workshops/:id`
- **THEN** the system stores `NULL` for both window fields

#### Scenario: Invalid window on update is rejected
- **GIVEN** an authenticated admin submits an update where `registrationOpenAt` is after `registrationCloseAt`
- **WHEN** the admin calls `PUT /admin/workshops/:id`
- **THEN** the system returns a 400 validation error
- **AND** no update is applied

#### Scenario: Updating PDF triggers AI summary queue
- **GIVEN** an authenticated admin submits a valid `pdfUrl` update for an existing workshop
- **WHEN** the workshop update is saved successfully
- **THEN** the system adds a job to `ai-summary-queue`
- **AND** the job payload contains `{ workshopId, pdfUrl }`

#### Scenario: Missing workshop update returns not found
- **GIVEN** an authenticated admin submits valid updates for a workshop ID that does not exist
- **WHEN** the admin calls `PUT /admin/workshops/:id`
- **THEN** the system returns a not found error
