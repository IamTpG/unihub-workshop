## ADDED Requirements

### Requirement: Admin can start student CSV import
The system SHALL provide an ADMIN-only API for starting a student CSV import from a multipart upload.

#### Scenario: Admin uploads valid CSV
- **WHEN** an ADMIN sends `POST /api/v1/admin/import/students` with a multipart `.csv` file containing required columns `studentId`, `email`, and `fullName`
- **THEN** the system creates an `ImportLog` row with `status = "PENDING"`, enqueues a job on `student-import-queue` with `{ importLogId, filePath }`, and responds `202` with `{ importLogId, message: "Import started" }`

#### Scenario: Non-admin attempts import
- **WHEN** a STUDENT or STAFF user sends `POST /api/v1/admin/import/students`
- **THEN** the system responds `403 Forbidden` and does not store or enqueue the import

#### Scenario: Upload is not CSV
- **WHEN** an ADMIN uploads a file whose content type or extension is not CSV
- **THEN** the system responds `400` with a clear message and does not create an `ImportLog`

#### Scenario: CSV is missing required columns
- **WHEN** an ADMIN uploads a CSV missing one or more of `studentId`, `email`, or `fullName`
- **THEN** the system responds `400` with a message listing the missing columns and does not enqueue a worker job

### Requirement: Admin can view student import logs
The system SHALL provide an ADMIN-only API for viewing recent student import logs.

#### Scenario: Admin lists recent import logs
- **WHEN** an ADMIN sends `GET /api/v1/admin/import/logs`
- **THEN** the system responds `200` with the newest 20 `ImportLog` records ordered by creation time descending

#### Scenario: Non-admin lists import logs
- **WHEN** a STUDENT or STAFF user sends `GET /api/v1/admin/import/logs`
- **THEN** the system responds `403 Forbidden`

### Requirement: Student import jobs process CSV rows
The worker SHALL process jobs from `student-import-queue` by reading the uploaded CSV file, validating rows, upserting student records, updating the import log, and deleting the temporary file.

#### Scenario: Valid row inserts new student
- **WHEN** a parsed CSV row has valid `studentId`, `email`, `fullName`, and no existing `StudentRecord` with that `studentId`
- **THEN** the worker inserts a new `StudentRecord`, defaults missing `status` to `ACTIVE`, and increments the import inserted count

#### Scenario: Valid row updates existing student
- **WHEN** a parsed CSV row has a `studentId` that already exists
- **THEN** the worker updates that record's `email`, `fullName`, and `status`, refreshes timestamps, and increments the import updated count

#### Scenario: Duplicate student ID appears in same file
- **WHEN** multiple rows in the same CSV file use the same `studentId`
- **THEN** the worker uses the last row for that `studentId` as the effective row and counts earlier duplicate rows as skipped

#### Scenario: Row is invalid
- **WHEN** a row is missing required fields or has an invalid email
- **THEN** the worker skips that row, increments the failed count, and continues processing remaining rows

#### Scenario: Email belongs to different student
- **WHEN** a row's email already exists on a different `StudentRecord.studentId`
- **THEN** the worker counts the row as failed and does not modify the existing record

#### Scenario: Import completes
- **WHEN** all parseable rows have been processed without a fatal error
- **THEN** the worker updates the `ImportLog` to `status = "DONE"` with accurate `inserted`, `updated`, `skipped`, and `failed` counts and logs a summary

#### Scenario: Import fails fatally
- **WHEN** the worker cannot read or parse the CSV file
- **THEN** the worker updates the `ImportLog` to `status = "FAILED"` with counts available from the attempt and logs the error

#### Scenario: Temporary file cleanup
- **WHEN** a student import worker job finishes successfully or fails fatally
- **THEN** the worker attempts to delete the temporary uploaded CSV file from disk

### Requirement: Student import queue contract is shared
The shared package SHALL expose the student import queue name and job payload type used by both API and worker.

#### Scenario: API enqueues import job
- **WHEN** the API creates an import job
- **THEN** it uses `STUDENT_IMPORT_QUEUE_NAME = "student-import-queue"` and a payload containing `importLogId` and `filePath`

#### Scenario: Worker consumes import job
- **WHEN** the worker registers the student import processor
- **THEN** it consumes jobs from `STUDENT_IMPORT_QUEUE_NAME` using the shared payload shape `{ importLogId: string, filePath: string }`
