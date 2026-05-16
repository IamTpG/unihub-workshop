## ADDED Requirements

### Requirement: AI summary job contract uses local PDF file path
The system SHALL define the AI summary queue payload as `{ workshopId: string, filePath: string }` and use `AI_SUMMARY_QUEUE_NAME = "ai-summary-queue"` for both API enqueueing and worker consumption.

#### Scenario: PDF upload enqueues summary job
- **WHEN** the API enqueues an AI summary job after a PDF upload
- **THEN** the job payload contains the target `workshopId` and the local stored PDF `filePath`

#### Scenario: Worker consumes summary job
- **WHEN** the worker registers the AI summary processor
- **THEN** it consumes jobs from `AI_SUMMARY_QUEUE_NAME` using the shared `{ workshopId, filePath }` payload shape

### Requirement: Worker extracts and cleans PDF text
The AI summary worker SHALL read the uploaded PDF from `filePath`, extract text with `pdf-parse`, and clean the extracted text before summary generation.

#### Scenario: PDF text is extracted successfully
- **WHEN** the worker processes a readable PDF job
- **THEN** it extracts raw text from the PDF file

#### Scenario: Extracted text is cleaned
- **WHEN** raw PDF text contains whitespace-only lines or three or more consecutive newlines
- **THEN** the worker removes whitespace-only lines, collapses three or more consecutive newlines into two newlines, and trims leading and trailing whitespace

### Requirement: Worker generates mock AI summary
The AI summary worker SHALL generate a mock summary without calling a real AI API.

#### Scenario: Mock summary is generated
- **WHEN** cleaned PDF text is available
- **THEN** the worker takes the first 500 characters and stores `"[AI Summary] This workshop covers the following topics: ${first500chars}..."` in `workshop.aiSummary`

#### Scenario: Summary generation is logged
- **WHEN** a workshop summary is generated
- **THEN** the worker logs `[AI_SUMMARY] Workshop {id} summary generated ({charCount} chars)`

### Requirement: Worker invalidates workshop detail cache
The AI summary worker SHALL invalidate stale workshop detail metadata after updating a summary.

#### Scenario: Detail cache is invalidated after summary update
- **WHEN** the worker successfully updates `workshop.aiSummary`
- **THEN** it deletes Redis key `workshop:{workshopId}:detail`

### Requirement: PDF parse failure is isolated
The AI summary worker SHALL handle PDF read or parse failures without deleting the uploaded file reference.

#### Scenario: PDF parse fails
- **WHEN** the worker cannot read or parse the PDF file
- **THEN** it logs the error, sets `workshop.aiSummary = null`, and leaves `workshop.pdfUrl` unchanged

#### Scenario: Parse failure does not call real AI
- **WHEN** PDF parsing fails
- **THEN** the worker does not attempt summary generation or any external AI API call
