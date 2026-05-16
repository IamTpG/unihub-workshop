## Why

Workshop details already expose an AI summary field, but there is no working upload or processing pipeline to generate it. This change completes the course requirement for admin PDF upload and asynchronous AI-style workshop summaries while keeping the implementation demo-safe through a mock summary generator.

## What Changes

- Add an ADMIN-only PDF upload endpoint at `POST /api/v1/admin/workshops/:id/pdf`.
- Accept multipart field `pdf`, validate `application/pdf`, enforce a 10MB limit, persist the file under `uploads/pdfs/`, update `workshop.pdfUrl`, and enqueue summary generation.
- Update the shared AI summary job contract to use `{ workshopId, filePath }`.
- Add an `ai-summary` worker processor that extracts PDF text with `pdf-parse`, cleans text, generates a mock summary, persists `workshop.aiSummary`, and invalidates workshop detail cache.
- Add failure isolation so PDF parse failures log an error, clear `aiSummary`, and leave `pdfUrl` available for admin visibility.
- Update admin workshop detail UI to upload/replace PDFs and show summary generation states.
- Update student workshop detail summary behavior so no empty summary card appears when no PDF exists, and processing state appears when a PDF exists but summary is not ready.

Non-goals:

- No real AI API integration.
- No object storage integration.
- No PDF management library beyond upload/replace for the workshop summary pipeline.
- No scheduled or batch summary regeneration.

## Capabilities

### New Capabilities

- `ai-summary`: Covers PDF upload, async PDF text extraction, mock summary generation, cache invalidation, and worker failure behavior.

### Modified Capabilities

- `admin-workshops`: Adds the admin PDF upload endpoint and changes summary jobs to use a stored file path instead of a URL-only payload.
- `workshops`: Student-safe workshop detail/list responses must expose enough PDF presence state for summary processing UI without leaking internal file paths.
- `admin-workshop-crud-ui`: Adds PDF upload/replace and summary generation state to the admin workshop detail screen.
- `workshop-ui`: Changes student summary card behavior for processing and absent-summary states.

## Impact

- Affected API modules: `apps/api/src/modules/ai-summary/`, `apps/api/src/modules/admin-workshops/`, `apps/api/src/routes/index.ts`, `apps/api/src/infra/queue/ai-summary.queue.ts`.
- Affected worker modules: `apps/worker/src/processors/ai-summary.processor.ts`, `apps/worker/src/main.ts`.
- Affected frontend files: `apps/web/src/pages/admin/workshops/WorkshopDetail.tsx`, `apps/web/src/stores/adminWorkshopStore.ts`, `apps/web/src/pages/student/WorkshopDetail.tsx`, `apps/web/src/components/workshop/DetailCards.tsx`, related API/store types.
- Affected shared package: `packages/shared/src/constants/queues.ts`, shared `AiSummaryJobData`.
- Dependencies: multer for multipart upload if not already present, `pdf-parse` for worker extraction.
