## ADDED Requirements

### Requirement: Admin can upload or replace workshop PDF on detail page
The admin workshop detail page SHALL provide controls for uploading or replacing the PDF used for AI summary generation.

#### Scenario: Workshop has no PDF
- **GIVEN** an authenticated admin views `/admin/workshops/:id` and the workshop has no `pdfUrl`
- **WHEN** the detail page renders
- **THEN** it shows a `PDF & AI Summary` section with a file input and an `Upload PDF for AI Summary` action

#### Scenario: Workshop has PDF and summary is processing
- **GIVEN** an authenticated admin views a workshop with `pdfUrl` set and `aiSummary` null
- **WHEN** the detail page renders
- **THEN** it shows `Summary is being generated...` with a spinner in the `PDF & AI Summary` section

#### Scenario: Workshop has generated summary
- **GIVEN** an authenticated admin views a workshop with `aiSummary` set
- **WHEN** the detail page renders
- **THEN** it displays the summary text and provides a `Replace PDF` action

#### Scenario: Admin uploads PDF from detail page
- **GIVEN** an authenticated admin selected a PDF file in the detail page
- **WHEN** the admin submits the upload action
- **THEN** the frontend posts multipart field `pdf` to `/api/v1/admin/workshops/:id/pdf`
- **AND** it shows upload progress or an uploading state
- **AND** after a `202` response it refreshes the workshop data

#### Scenario: Upload fails
- **GIVEN** the admin PDF upload request fails validation or returns a server error
- **WHEN** the API response is received
- **THEN** the page displays a clear error message and keeps the upload control available

## MODIFIED Requirements

### Requirement: Admin can view workshop details with stats
The system SHALL display full workshop details, registration statistics, and PDF/AI summary controls at `/admin/workshops/:id`.

#### Scenario: Workshop detail renders with stats
- **GIVEN** an authenticated admin user
- **WHEN** the admin navigates to `/admin/workshops/:id`
- **THEN** the system fetches data from `GET /admin/workshops/:id/stats`
- **AND** renders all workshop fields (title, description, speaker, location, dates, capacity, price, status, PDF URL, room layout URL)
- **AND** renders registration counts grouped by status
- **AND** renders the total registration count
- **AND** renders a `PDF & AI Summary` section for upload, processing, summary, and replace states

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

### Requirement: Admin workshop store manages API state
The system SHALL use a Zustand store to manage all admin workshop API interactions, including PDF upload for AI summary generation.

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

#### Scenario: Store uploads workshop PDF
- **GIVEN** the detail page submits a selected PDF file
- **WHEN** the store's PDF upload action is called with workshop id and file
- **THEN** the store sends multipart `POST /admin/workshops/:id/pdf` with field `pdf`
- **AND** returns the accepted upload response on success
