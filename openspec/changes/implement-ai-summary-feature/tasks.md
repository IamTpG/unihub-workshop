## 1. Shared Contracts and Dependencies

- [x] 1.1 Developer A: Update `AiSummaryJobData` in `packages/shared` to `{ workshopId: string; filePath: string }`.
- [x] 1.2 Developer A: Confirm `AI_SUMMARY_QUEUE_NAME = "ai-summary-queue"` is exported from shared constants and used by API and worker.
- [x] 1.3 Developer A: Add API upload dependencies/types for multer if missing.
- [x] 1.4 Developer B: Add worker dependency and types for `pdf-parse`.

## 2. Backend PDF Upload API

- [x] 2.1 Developer A: Create or populate `apps/api/src/modules/ai-summary/` with routes, controller, service, and upload middleware.
- [x] 2.2 Developer A: Implement multer disk storage for multipart field `pdf`, saving files under `uploads/pdfs/{workshopId}.pdf`.
- [x] 2.3 Developer A: Validate ADMIN authentication/authorization, existing workshop ID, `application/pdf` mimetype, and 10MB maximum size.
- [x] 2.4 Developer A: On valid upload, update `workshop.pdfUrl` to the stored file path and clear any existing `workshop.aiSummary`.
- [x] 2.5 Developer A: Update `apps/api/src/infra/queue/ai-summary.queue.ts` to enqueue `{ workshopId, filePath }`.
- [x] 2.6 Developer A: Return `202 { message: "PDF uploaded. Summary generation started." }` for successful upload.
- [x] 2.7 Developer A: Return clear `400`, `403`, `404`, or `500` responses for validation, authorization, missing workshop, upload, and enqueue failures.
- [x] 2.8 Developer A: Mount the route at `POST /api/v1/admin/workshops/:id/pdf`.

## 3. Worker Summary Processor

- [x] 3.1 Developer B: Create `apps/worker/src/processors/ai-summary.processor.ts`.
- [x] 3.2 Developer B: Register the AI summary processor in `apps/worker/src/main.ts`.
- [x] 3.3 Developer B: Read uploaded PDFs from `filePath` using `pdf-parse`.
- [x] 3.4 Developer B: Clean extracted text by removing whitespace-only lines, collapsing 3+ consecutive newlines into 2, and trimming.
- [x] 3.5 Developer B: Generate the mock summary from the first 500 cleaned characters using the required `[AI Summary]` prefix.
- [x] 3.6 Developer B: Persist the mock summary to `workshop.aiSummary`.
- [x] 3.7 Developer B: Delete Redis key `workshop:{workshopId}:detail` after successful summary update.
- [x] 3.8 Developer B: Log `[AI_SUMMARY] Workshop {id} summary generated ({charCount} chars)` on success.
- [x] 3.9 Developer B: On PDF read/parse failure, log the error, set `workshop.aiSummary = null`, and leave `workshop.pdfUrl` unchanged.

## 4. Student-Safe Workshop API Payloads

- [x] 4.1 Developer A: Add a boolean PDF presence field such as `hasPdf` to student workshop list responses without exposing `pdfUrl`.
- [x] 4.2 Developer A: Add the same PDF presence field to student workshop detail responses without exposing `pdfUrl`.
- [x] 4.3 Developer A: Ensure workshop detail cache stores enough metadata for `hasPdf` and can be invalidated by the worker.

## 5. Admin Frontend

- [x] 5.1 Developer A: Add an admin store action for multipart `POST /admin/workshops/:id/pdf` with field `pdf`.
- [x] 5.2 Developer A: Add a `PDF & AI Summary` section to `apps/web/src/pages/admin/workshops/WorkshopDetail.tsx`.
- [x] 5.3 Developer A: Render file input and `Upload PDF for AI Summary` when `pdfUrl` is absent.
- [x] 5.4 Developer A: Render `Summary is being generated...` with a spinner when `pdfUrl` exists and `aiSummary` is null.
- [x] 5.5 Developer A: Render existing summary text and a `Replace PDF` action when `aiSummary` exists.
- [x] 5.6 Developer A: Show upload progress or an uploading state, display upload errors, and refresh workshop data after a `202` response.

## 6. Student Frontend

- [x] 6.1 Developer B: Update workshop frontend types/store to carry the student-safe PDF presence field.
- [x] 6.2 Developer B: Update `DetailSummaryCard` so `aiSummary` renders as before.
- [x] 6.3 Developer B: Render `Summary processing...` when PDF presence is true and `aiSummary` is null.
- [x] 6.4 Developer B: Render no summary card when PDF presence is false and `aiSummary` is null.
- [x] 6.5 Developer B: Update `apps/web/src/pages/student/WorkshopDetail.tsx` to pass summary and PDF presence state correctly.

## 7. Verification

- [ ] 7.1 Developer A: Add or update API tests for admin-only PDF upload, invalid mimetype, oversized file, missing workshop, and successful enqueue.
- [ ] 7.2 Developer B: Add or update worker tests for PDF parse success, text cleanup, mock summary generation, cache invalidation, and parse failure behavior.
- [x] 7.3 Developer A: Add or update frontend tests or manual verification notes for admin upload, replace, processing, and error states.
- [x] 7.4 Developer B: Add or update frontend tests or manual verification notes for student summary available, processing, and absent states.
- [x] 7.5 Developer A: Run API build/typecheck and relevant tests.
- [x] 7.6 Developer B: Run worker and web build/typecheck and relevant tests.
