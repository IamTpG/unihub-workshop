# Specification: AI Summary and PDF Pipeline

## Description

This feature adds Admin PDF upload and asynchronous summary generation for workshops. It defines the API contract, worker behavior, and how student-facing responses are shaped.

Key capabilities:

- Admin-only PDF upload endpoint
- local storage of uploaded PDFs
- queueing of AI summary jobs with a stable payload contract
- worker text extraction and mock summary generation
- Redis invalidation for stale workshop detail cache
- student-safe workshop responses exposing `hasPdf` and `aiSummary`

---

## Main Flow

### 1. Upload and enqueue

1. An Admin calls `POST /api/v1/admin/workshops/:id/pdf` with a multipart `pdf` field.
2. The API verifies `ADMIN` role, workshop existence, file type, and file size (10MB max).
3. The API stores the PDF under `uploads/pdfs/{workshopId}.pdf`.
4. The API updates `workshop.pdfUrl` and clears any existing `workshop.aiSummary`.
5. The API enqueues a job to `AI_SUMMARY_QUEUE_NAME = "ai-summary-queue"` with payload `{ workshopId, filePath }`.
6. The API returns `202 Accepted` with a summary-started message.

### 2. Worker processing

1. The worker consumes jobs from `ai-summary-queue`.
2. The worker reads the local PDF from `filePath`.
3. The worker extracts text using `pdf-parse`.
4. The worker cleans extracted text by removing whitespace-only lines, collapsing repeated newlines, and trimming whitespace.
5. The worker creates a mock summary from the first 500 cleaned characters.
6. The worker updates `workshop.aiSummary` with the generated summary.
7. The worker invalidates Redis key `workshop:{workshopId}:detail`.

### 3. Student-facing response shaping

1. Student APIs return workshop metadata without exposing `pdfUrl`.
2. The API includes `hasPdf` when a PDF exists.
3. The API exposes `aiSummary` when available.
4. Students never receive the internal file path.

---

## Access Control

- `POST /api/v1/admin/workshops/:id/pdf` requires `authenticate` and `requireRoles([Role.ADMIN])`.
- Only Admins can upload PDFs.
- Student-facing workshop endpoints do not expose internal `pdfUrl` values.

---

## Data Model

Workshop fields involved:

- `pdfUrl`: local file path to the stored PDF
- `aiSummary`: generated mock summary text
- `hasPdf` (derived): `true` when `pdfUrl` exists

No additional database tables are required.

---

## Error Scenarios

| Scenario | Behavior |
| --- | --- |
| Invalid file type | `400 Bad Request` |
| File larger than 10MB | `400 Bad Request` |
| Workshop not found | `404 Not Found` |
| Worker PDF parse failure | log error, set `workshop.aiSummary = null`, preserve `pdfUrl` |
| Cache invalidation failure | log error and continue |

---

## Constraints

- Uploads must be `application/pdf` and no larger than 10MB.
- The endpoint is Admin-only.
- The API must never return `pdfUrl` in student-facing responses.
- The worker must use local mock summary generation; no external AI API.
- Cache invalidation is required after updating `aiSummary`.

---

## Acceptance Criteria

- Admins can upload a PDF via `POST /api/v1/admin/workshops/:id/pdf`.
- The API stores the file and updates `workshop.pdfUrl`.
- The API enqueues `ai-summary-queue` with `{ workshopId, filePath }`.
- The worker generates `aiSummary` from the first 500 cleaned characters.
- The worker invalidates `workshop:{workshopId}:detail` in Redis.
- Student APIs include `hasPdf` and `aiSummary` but never `pdfUrl`.
