## ADDED Requirements

### Requirement: System stores a canonical student roster
The system SHALL maintain a `StudentRecord` table as the source-of-truth for institutionally imported students. Each record SHALL be uniquely identified by institutional `studentId` and `email`.

#### Scenario: New student record inserted
- **WHEN** an import batch contains a student ID and email not present in `student_records`
- **THEN** a new row is inserted with `status = "ACTIVE"` and `importedAt` set to the current timestamp

#### Scenario: Existing student record updated
- **WHEN** an import batch contains a student ID already present in `student_records`
- **THEN** the existing row is updated (upsert) and the `updatedAt` timestamp is refreshed

#### Scenario: Duplicate email from different student ID
- **WHEN** an import batch contains an email that already maps to a different `studentId`
- **THEN** the row is counted as `failed` in the `ImportLog` and skipped without modifying the existing record

### Requirement: Each import batch is logged
The system SHALL create an `ImportLog` row for every import operation, recording totals for inserted, updated, skipped, and failed rows.

#### Scenario: Successful batch completes
- **WHEN** an import batch finishes processing all rows without a fatal error
- **THEN** the corresponding `ImportLog` row has `status = "DONE"` and accurate counts for `inserted`, `updated`, `skipped`, and `failed`

#### Scenario: Import fails fatally mid-batch
- **WHEN** an import batch encounters an unrecoverable error (e.g., file parse failure)
- **THEN** the corresponding `ImportLog` row has `status = "FAILED"` and reflects counts up to the point of failure

#### Scenario: Import starts
- **WHEN** an import job is created
- **THEN** an `ImportLog` row is inserted with `status = "PENDING"` before any rows are processed
