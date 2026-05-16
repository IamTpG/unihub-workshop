## ADDED Requirements

### Requirement: Admin can upload workshop PDF for AI summary
The system SHALL expose an ADMIN-only multipart endpoint `POST /api/v1/admin/workshops/:id/pdf` for uploading or replacing the PDF used to generate a workshop AI summary.

#### Scenario: Admin uploads valid PDF
- **GIVEN** an authenticated ADMIN selects a PDF file for an existing workshop
- **WHEN** the admin sends `POST /api/v1/admin/workshops/:id/pdf` with multipart field `pdf`
- **THEN** the system stores the file at a local path such as `uploads/pdfs/{workshopId}.pdf`
- **AND** updates `workshop.pdfUrl` to the stored file path
- **AND** clears any existing `workshop.aiSummary`
- **AND** enqueues an AI summary job with `{ workshopId, filePath }`
- **AND** responds `202` with `{ message: "PDF uploaded. Summary generation started." }`

#### Scenario: Non-admin upload is forbidden
- **GIVEN** an authenticated user has role `STUDENT` or `STAFF`
- **WHEN** the user sends `POST /api/v1/admin/workshops/:id/pdf`
- **THEN** the system returns `403 Forbidden` before storing the file

#### Scenario: Uploaded file is not PDF
- **GIVEN** an authenticated ADMIN uploads a file whose mimetype is not `application/pdf`
- **WHEN** the admin sends `POST /api/v1/admin/workshops/:id/pdf`
- **THEN** the system returns `400` with a clear validation message and does not enqueue a summary job

#### Scenario: Uploaded PDF exceeds size limit
- **GIVEN** an authenticated ADMIN uploads a PDF larger than 10MB
- **WHEN** the admin sends `POST /api/v1/admin/workshops/:id/pdf`
- **THEN** the system returns `400` with a clear size-limit message and does not enqueue a summary job

#### Scenario: Workshop does not exist
- **GIVEN** an authenticated ADMIN uploads a valid PDF for a missing workshop ID
- **WHEN** the admin sends `POST /api/v1/admin/workshops/:id/pdf`
- **THEN** the system returns `404 Not Found` and does not enqueue a summary job

## MODIFIED Requirements

### Requirement: PDF creation triggers AI summary queue
The system SHALL enqueue an AI summary job after a workshop PDF is uploaded and stored locally.

#### Scenario: AI summary job is queued after PDF upload
- **GIVEN** an authenticated admin uploads a valid PDF for an existing workshop
- **WHEN** the PDF path is saved successfully to the workshop record
- **THEN** the system adds a job to `ai-summary-queue`
- **AND** the job payload contains `{ workshopId, filePath }`

#### Scenario: AI summary job is not queued without PDF
- **GIVEN** an authenticated admin creates or updates a workshop without uploading a PDF file
- **WHEN** the workshop record is saved successfully
- **THEN** the system does not add an AI summary job

#### Scenario: Queue failure is isolated from persistence
- **GIVEN** a PDF is stored successfully and the workshop `pdfUrl` is updated
- **WHEN** the AI summary queue is unavailable or times out
- **THEN** the workshop record remains persisted
- **AND** the system reports the enqueue failure through a clear API error path

### Requirement: Admin can update workshops
The system SHALL allow an admin to update workshop details through `PUT /admin/workshops/:id` using Prisma persistence. JSON workshop updates SHALL NOT replace the multipart PDF upload endpoint for summary generation.

#### Scenario: Workshop details are updated
- **GIVEN** an authenticated admin submits valid updates for an existing workshop
- **WHEN** the admin calls `PUT /admin/workshops/:id`
- **THEN** the system updates the matching workshop record
- **AND** returns the updated workshop

#### Scenario: Updating JSON fields does not process PDF files
- **GIVEN** an authenticated admin submits valid JSON updates for an existing workshop
- **WHEN** the workshop update is saved successfully through `PUT /admin/workshops/:id`
- **THEN** the system does not attempt to read a PDF file from the JSON request
- **AND** summary generation is handled by `POST /admin/workshops/:id/pdf`

#### Scenario: Missing workshop update returns not found
- **GIVEN** an authenticated admin submits valid updates for a workshop ID that does not exist
- **WHEN** the admin calls `PUT /admin/workshops/:id`
- **THEN** the system returns a not found error
