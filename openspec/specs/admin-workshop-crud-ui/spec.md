# admin-workshop-crud-ui Specification

## Purpose
TBD - created by archiving change add-admin-workshop-crud-ui. Update Purpose after archive.
## Requirements
### Requirement: Admin can view workshop list
The system SHALL display a paginated table of all workshops when an admin navigates to `/admin/workshops`.

#### Scenario: Workshop list renders with data
- **GIVEN** an authenticated admin user
- **WHEN** the admin navigates to `/admin/workshops`
- **THEN** the system fetches workshops from `GET /admin/workshops?page=1&limit=10`
- **AND** renders a table with columns: title, speaker, location, start time, status, and actions
- **AND** each row provides "View" and "Edit" action links

#### Scenario: Workshop list shows loading state
- **GIVEN** an authenticated admin user
- **WHEN** the workshop list API request is in-flight
- **THEN** the system SHALL display a loading indicator

#### Scenario: Workshop list shows error state
- **GIVEN** an authenticated admin user
- **WHEN** the workshop list API request fails
- **THEN** the system SHALL display an error message with the failure reason
- **AND** provide a "Retry" action to re-fetch

#### Scenario: Workshop list shows empty state
- **GIVEN** an authenticated admin user
- **WHEN** the API returns zero workshop items
- **THEN** the system SHALL display an empty state message
- **AND** provide a "Create Workshop" action link

#### Scenario: Workshop list supports pagination
- **GIVEN** an authenticated admin viewing the workshop list
- **WHEN** the total workshop count exceeds the page limit
- **THEN** the system SHALL render pagination controls (Previous / Next)
- **AND** clicking "Next" fetches the next page of results
- **AND** clicking "Previous" fetches the previous page of results
- **AND** the "Previous" button is disabled on page 1
- **AND** the "Next" button is disabled on the last page

### Requirement: Admin can create a workshop
The system SHALL provide a form at `/admin/workshops/new` for creating a new workshop.

#### Scenario: Create form renders with correct fields
- **GIVEN** an authenticated admin user
- **WHEN** the admin navigates to `/admin/workshops/new`
- **THEN** the system renders a form with inputs for: title, description, speaker name, location, room layout URL, PDF URL, start time, end time, capacity, price, and status

#### Scenario: Workshop is created successfully
- **GIVEN** an authenticated admin has filled in valid workshop data
- **WHEN** the admin submits the create form
- **THEN** the system sends `POST /admin/workshops` with the form data
- **AND** on success, navigates to the workshop list at `/admin/workshops`
- **AND** the workshop list reflects the newly created workshop

#### Scenario: Create form shows validation error from server
- **GIVEN** an authenticated admin submits invalid workshop data
- **WHEN** the server responds with a 400 validation error
- **THEN** the system SHALL display the server error message inline
- **AND** the form remains populated with the submitted data

#### Scenario: Create form shows network error
- **GIVEN** an authenticated admin submits valid workshop data
- **WHEN** the server is unreachable or responds with a 5xx error
- **THEN** the system SHALL display a generic error message
- **AND** the form remains populated so the admin can retry

#### Scenario: Create form enforces endTime after startTime
- **GIVEN** an authenticated admin enters a start time and end time
- **WHEN** the end time is before or equal to the start time
- **THEN** the system SHALL prevent submission
- **AND** display a validation message indicating endTime must be after startTime

### Requirement: Admin can view workshop details with stats
The system SHALL display full workshop details and registration statistics at `/admin/workshops/:id`.

#### Scenario: Workshop detail renders with stats
- **GIVEN** an authenticated admin user
- **WHEN** the admin navigates to `/admin/workshops/:id`
- **THEN** the system fetches data from `GET /admin/workshops/:id/stats`
- **AND** renders all workshop fields (title, description, speaker, location, dates, capacity, price, status, PDF URL, room layout URL)
- **AND** renders registration counts grouped by status
- **AND** renders the total registration count

#### Scenario: Workshop detail shows loading state
- **GIVEN** an authenticated admin user
- **WHEN** the stats API request is in-flight
- **THEN** the system SHALL display a loading indicator

#### Scenario: Workshop detail shows not-found state
- **GIVEN** an authenticated admin user
- **WHEN** the API returns a 404 for the requested workshop ID
- **THEN** the system SHALL display a "Workshop not found" message
- **AND** provide a link back to the workshop list

#### Scenario: Workshop detail provides edit navigation
- **GIVEN** an authenticated admin viewing a workshop detail
- **WHEN** the admin clicks the "Edit" action
- **THEN** the system navigates to `/admin/workshops/:id/edit`

### Requirement: Admin can edit an existing workshop
The system SHALL provide a pre-filled form at `/admin/workshops/:id/edit` for editing an existing workshop.

#### Scenario: Edit form loads with existing data
- **GIVEN** an authenticated admin user
- **WHEN** the admin navigates to `/admin/workshops/:id/edit`
- **THEN** the system fetches the workshop from `GET /admin/workshops/:id`
- **AND** pre-populates the form fields with the existing workshop data

#### Scenario: Workshop is updated successfully
- **GIVEN** an authenticated admin has modified workshop fields
- **WHEN** the admin submits the edit form
- **THEN** the system sends `PUT /admin/workshops/:id` with the changed data
- **AND** on success, navigates to `/admin/workshops/:id` detail view

#### Scenario: Edit form shows not-found state
- **GIVEN** an authenticated admin user
- **WHEN** the API returns a 404 when fetching the workshop for editing
- **THEN** the system SHALL display a "Workshop not found" message
- **AND** provide a link back to the workshop list

#### Scenario: Edit form shows server error
- **GIVEN** an authenticated admin submits updated workshop data
- **WHEN** the server responds with an error
- **THEN** the system SHALL display the error message inline
- **AND** the form remains populated with the submitted data

### Requirement: Admin workshop store manages API state
The system SHALL use a Zustand store to manage all admin workshop API interactions.

#### Scenario: Store fetches paginated workshop list
- **GIVEN** the admin workshop list page mounts
- **WHEN** the store's `fetchWorkshops` action is called with page and limit
- **THEN** the store sets `isLoading` to true
- **AND** sends `GET /admin/workshops?page=X&limit=Y`
- **AND** on success, stores the items and pagination metadata
- **AND** sets `isLoading` to false

#### Scenario: Store handles fetch error
- **GIVEN** the store's `fetchWorkshops` action is called
- **WHEN** the API request fails
- **THEN** the store sets `error` with the failure message
- **AND** sets `isLoading` to false

#### Scenario: Store creates a workshop
- **GIVEN** the create form submits data
- **WHEN** the store's `createWorkshop` action is called
- **THEN** the store sends `POST /admin/workshops` with the form payload
- **AND** returns the created workshop on success

#### Scenario: Store updates a workshop
- **GIVEN** the edit form submits data
- **WHEN** the store's `updateWorkshop` action is called with id and data
- **THEN** the store sends `PUT /admin/workshops/:id` with the update payload
- **AND** returns the updated workshop on success

#### Scenario: Store fetches workshop stats
- **GIVEN** the detail page mounts
- **WHEN** the store's `fetchWorkshopStats` action is called with id
- **THEN** the store sends `GET /admin/workshops/:id/stats`
- **AND** stores the workshop details and registration statistics

