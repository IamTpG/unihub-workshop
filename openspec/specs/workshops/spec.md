## ADDED Requirements

### Requirement: Student workshop routes are protected
The system SHALL expose workshop viewing routes only to authenticated users whose role is `STUDENT`.

#### Scenario: Student accesses workshop routes
- **GIVEN** an authenticated user has the `STUDENT` role
- **WHEN** the user calls a `/workshops` endpoint
- **THEN** the request is allowed to reach the workshop controller

#### Scenario: Unauthenticated user is rejected
- **GIVEN** no authenticated user is available on the request
- **WHEN** the request calls a `/workshops` endpoint
- **THEN** the system returns an authentication error before executing workshop logic

#### Scenario: Non-student user is forbidden
- **GIVEN** an authenticated user has a role other than `STUDENT`
- **WHEN** the user calls a `/workshops` endpoint
- **THEN** the system returns a 403 Forbidden response

### Requirement: Student can list published workshops
The system SHALL expose `GET /workshops` for a paginated student fast-view workshop list and SHALL return only workshops with `status = PUBLISHED`.

#### Scenario: Published workshops are returned
- **GIVEN** published and non-published workshops exist
- **WHEN** a student calls `GET /workshops`
- **THEN** the response contains only workshops whose status is `PUBLISHED`
- **AND** each item contains only `id`, `title`, `speakerName`, `location`, `startTime`, `endTime`, `capacity`, `availableSlots`, `price`, and `aiSummary`
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

### Requirement: Published list uses Redis cache
The system SHALL use Redis key `workshops:published` to cache the published workshop list for 5 minutes.

#### Scenario: List cache hit
- **GIVEN** Redis contains a valid value at `workshops:published`
- **WHEN** a student calls `GET /workshops`
- **THEN** the system uses the cached list
- **AND** the system does not query Prisma for the list

#### Scenario: List cache miss
- **GIVEN** Redis does not contain `workshops:published`
- **WHEN** a student calls `GET /workshops`
- **THEN** the system queries Prisma for published workshops
- **AND** stores the result in Redis with a 5-minute TTL
- **AND** returns the result

#### Scenario: Redis list cache failure falls back to Prisma
- **GIVEN** Redis is unavailable or times out during list cache access
- **WHEN** a student calls `GET /workshops`
- **THEN** the system queries Prisma for published workshops
- **AND** returns the Prisma result without exposing internal asset URLs

### Requirement: Published list includes live availability efficiently
The system SHALL enrich `GET /workshops` responses with live slot values using one Redis `MGET` call for `workshop:{id}:slots` keys.

#### Scenario: Live availability is merged into list items
- **GIVEN** the published workshop list contains multiple workshops
- **WHEN** a student calls `GET /workshops`
- **THEN** the system extracts the workshop IDs
- **AND** fetches `workshop:{id}:slots` values with one Redis `MGET`
- **AND** maps the retrieved values back to the matching workshop items as `availableSlots`

#### Scenario: Missing slot key uses database fallback value
- **GIVEN** a published workshop list item has `availableSlots` from the cached or Prisma list
- **AND** Redis `MGET` returns null for `workshop:{id}:slots`
- **WHEN** a student calls `GET /workshops`
- **THEN** the system returns the item's existing `availableSlots` value

#### Scenario: Slot MGET failure falls back to list values
- **GIVEN** Redis is unavailable or times out during slot `MGET`
- **WHEN** a student calls `GET /workshops`
- **THEN** the system returns the list using each item's existing `availableSlots` value

### Requirement: Student can view workshop details
The system SHALL expose `GET /workshops/:id` for a student-safe workshop detail view.

#### Scenario: Workshop details are returned
- **GIVEN** a workshop exists
- **WHEN** a student calls `GET /workshops/:id`
- **THEN** the response contains only `id`, `title`, `speakerName`, `location`, `startTime`, `endTime`, `capacity`, `availableSlots`, `price`, `description`, `roomLayoutUrl`, and `aiSummary`

#### Scenario: PDF URL is excluded from details
- **GIVEN** a workshop has `pdfUrl`
- **WHEN** a student calls `GET /workshops/:id`
- **THEN** the response does not include `pdfUrl`

#### Scenario: Missing workshop detail returns not found
- **GIVEN** no workshop exists for the requested ID
- **WHEN** a student calls `GET /workshops/:id`
- **THEN** the system returns a not found error

### Requirement: Workshop details use cached metadata and live availability
The system SHALL cache static workshop detail metadata at `workshop:{id}:detail` for 5 minutes and SHALL merge live availability into the detail response separately.

#### Scenario: Detail metadata cache hit
- **GIVEN** Redis contains valid detail metadata at `workshop:{id}:detail`
- **WHEN** a student calls `GET /workshops/:id`
- **THEN** the system uses the cached metadata
- **AND** fetches live availability through the availability lookup
- **AND** returns the merged detail payload with `availableSlots`

#### Scenario: Detail metadata cache miss
- **GIVEN** Redis does not contain `workshop:{id}:detail`
- **WHEN** a student calls `GET /workshops/:id`
- **THEN** the system queries Prisma for detail metadata without selecting `availableSlots`
- **AND** stores the metadata in Redis with a 5-minute TTL
- **AND** fetches live availability through the availability lookup
- **AND** returns the merged detail payload with `availableSlots`

### Requirement: Student can view live workshop availability
The system SHALL expose `GET /workshops/:id/availability` and SHALL read live available slots from Redis key `workshop:{id}:slots` before using Prisma fallback.

#### Scenario: Availability cache hit
- **GIVEN** Redis contains `workshop:{id}:slots`
- **WHEN** a student calls `GET /workshops/:id/availability`
- **THEN** the system returns the Redis slot value
- **AND** the system does not query Prisma

#### Scenario: Availability cache miss
- **GIVEN** Redis does not contain `workshop:{id}:slots`
- **WHEN** a student calls `GET /workshops/:id/availability`
- **THEN** the system queries Prisma for the workshop `availableSlots`
- **AND** stores the slot value in Redis at `workshop:{id}:slots`
- **AND** returns the slot value

#### Scenario: Missing workshop availability returns not found
- **GIVEN** Redis does not contain `workshop:{id}:slots`
- **AND** no workshop exists for the requested ID
- **WHEN** a student calls `GET /workshops/:id/availability`
- **THEN** the system returns a not found error

#### Scenario: Redis availability failure falls back to Prisma
- **GIVEN** Redis is unavailable or times out during availability lookup
- **WHEN** a student calls `GET /workshops/:id/availability`
- **THEN** the system queries Prisma for `availableSlots`
- **AND** returns the Prisma value when the workshop exists
