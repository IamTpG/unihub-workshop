## MODIFIED Requirements

### Requirement: Student can list published workshops
The system SHALL expose `GET /workshops` for a paginated student fast-view workshop list and SHALL return only workshops with `status = PUBLISHED`.

#### Scenario: Published workshops are returned
- **GIVEN** published and non-published workshops exist
- **WHEN** a student calls `GET /workshops`
- **THEN** the response contains only workshops whose status is `PUBLISHED`
- **AND** each item contains only `id`, `title`, `speakerName`, `location`, `startTime`, `endTime`, `capacity`, `availableSlots`, `price`, `aiSummary`, and a boolean PDF presence field such as `hasPdf`
- **AND** the response includes pagination metadata with total count, page, limit, and total pages

#### Scenario: Default pagination is applied
- **GIVEN** a student omits pagination query parameters
- **WHEN** the student calls `GET /workshops`
- **THEN** the system returns the first page using default pagination values

#### Scenario: Invalid pagination is rejected
- **GIVEN** a student provides invalid pagination query parameters
- **WHEN** the student calls `GET /workshops`
- **THEN** the system returns a validation error

#### Scenario: Internal asset URLs are excluded from list
- **GIVEN** a published workshop has `roomLayoutUrl` and `pdfUrl`
- **WHEN** a student calls `GET /workshops`
- **THEN** the response does not include `roomLayoutUrl`
- **AND** the response does not include `pdfUrl`
- **AND** the response may include only boolean PDF presence state

### Requirement: Student can view workshop details
The system SHALL expose `GET /workshops/:id` for a student-safe workshop detail view.

#### Scenario: Workshop details are returned
- **GIVEN** a workshop exists
- **WHEN** a student calls `GET /workshops/:id`
- **THEN** the response contains only `id`, `title`, `speakerName`, `location`, `startTime`, `endTime`, `capacity`, `availableSlots`, `price`, `description`, `roomLayoutUrl`, `aiSummary`, and a boolean PDF presence field such as `hasPdf`

#### Scenario: PDF URL is excluded from details
- **GIVEN** a workshop has `pdfUrl`
- **WHEN** a student calls `GET /workshops/:id`
- **THEN** the response does not include `pdfUrl`
- **AND** the response includes only boolean PDF presence state needed for summary processing UI

#### Scenario: Missing workshop detail returns not found
- **GIVEN** no workshop exists for the requested ID
- **WHEN** a student calls `GET /workshops/:id`
- **THEN** the system returns a not found error
