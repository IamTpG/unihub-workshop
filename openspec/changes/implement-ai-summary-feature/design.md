## Context

The `Workshop` model already has `pdfUrl` and `aiSummary`, and student UI can render `workshop.aiSummary`. The missing part is the actual PDF upload and summary generation pipeline. The API has an `ai-summary.queue.ts` wrapper and a queue name, but the payload currently follows URL-oriented naming while the requested implementation needs local file processing through `filePath`.

This change crosses API upload handling, shared queue contracts, worker processing, Redis cache invalidation, and admin/student UI states.

Critical flows:

1. Admin upload: ADMIN opens workshop detail -> selects a PDF -> frontend sends `POST /api/v1/admin/workshops/:id/pdf` with multipart field `pdf` -> API validates workshop, file type, and size -> multer stores to `uploads/pdfs/{workshopId}.pdf` -> API updates `workshop.pdfUrl` and clears old `aiSummary` for regeneration -> API enqueues `{ workshopId, filePath }` -> API returns `202`.
2. Summary worker: worker consumes `ai-summary-queue` -> reads PDF with `pdf-parse` -> extracts and cleans text -> generates mock summary from first 500 chars -> updates `workshop.aiSummary` -> deletes Redis `workshop:{workshopId}:detail` -> logs `[AI_SUMMARY] Workshop {id} summary generated ({charCount} chars)`.
3. Parse failure: worker catches PDF read/parse errors -> logs failure -> sets `workshop.aiSummary = null` -> leaves `pdfUrl` untouched so admin can see that a file exists and re-upload.
4. Admin UI: workshop detail fetches stats -> renders PDF upload/replace controls -> shows uploading progress -> refreshes workshop data after `202` -> displays processing text while `pdfUrl` exists and `aiSummary` is null.
5. Student UI: detail summary card renders summary when available, processing placeholder when a PDF exists without summary, and no card when neither PDF nor summary exists.

## Goals / Non-Goals

**Goals:**

- Provide a working ADMIN-only PDF upload endpoint for workshop summaries.
- Generate summaries asynchronously in the worker using local PDF extraction and a mock AI formatter.
- Keep student-facing PDF paths private by exposing only PDF presence state where needed.
- Make upload and parse failures clear without corrupting workshop records.
- Keep the implementation small and demoable.

**Non-Goals:**

- No real AI provider calls.
- No object storage or public file serving requirement.
- No summary quality tuning beyond the specified mock output.
- No scheduled summary regeneration.

## Decisions

1. Store PDFs on local disk under `uploads/pdfs/{workshopId}.pdf`.

   Rationale: the project has no object storage layer and the requirement explicitly allows local disk. A deterministic path makes replacement straightforward.

   Alternative considered: store the original filename. Rejected because repeated uploads would create cleanup work and stale files.

2. Use a dedicated `POST /api/v1/admin/workshops/:id/pdf` endpoint.

   Rationale: multipart upload is different from JSON workshop CRUD and should not overload the existing create/update endpoints.

   Alternative considered: keep `pdfUrl` in the workshop form. Rejected for generation because the worker needs a local `filePath` it can read with `pdf-parse`.

3. Change `AiSummaryJobData` to `{ workshopId, filePath }`.

   Rationale: the worker must read the uploaded PDF from disk. Naming the field `filePath` avoids confusing local paths with public URLs.

   Alternative considered: keep `pdfUrl` and store local paths in it. Rejected because it hides an important difference and makes future real storage integration harder.

4. Clear `aiSummary` when a PDF is uploaded.

   Rationale: a replacement PDF invalidates the old summary immediately. This lets both admin and student UIs show a processing state until the new summary is generated.

   Alternative considered: leave old summary until new one succeeds. Rejected because users could see stale content for a newly uploaded document.

5. Expose PDF presence to student UI without exposing `pdfUrl`.

   Rationale: student detail needs to distinguish "processing" from "no summary configured", but internal local paths should remain server-side.

   Alternative considered: return `pdfUrl` to students. Rejected because it leaks internal file paths and is not needed for the UI.

6. Invalidate only `workshop:{id}:detail` after summary generation.

   Rationale: the detailed view is the cache specifically containing `aiSummary`. This is minimal and matches the stated requirement.

   Alternative considered: delete all workshop caches. Rejected as unnecessary for the MVP; list cache can be broadened later if stale summaries in lists become visible.

## Risks / Trade-offs

- Local uploads are not durable across deployments -> Acceptable for course/demo scope; future object storage can replace `filePath` behind the queue contract.
- Upload succeeds but enqueue fails -> Return a clear server error after file/workshop update failure handling; implementation should avoid leaving misleading `aiSummary`.
- Large or malformed PDFs can fail parsing -> Worker catches parse errors, logs them, clears `aiSummary`, and leaves `pdfUrl` so admin can re-upload.
- Mock summaries can include rough text from PDFs -> Limit to first 500 cleaned characters and prepend a clear `[AI Summary]` marker.
- Student UI needs PDF presence but current API excludes `pdfUrl` -> Add a boolean such as `hasPdf` to student-safe responses instead of exposing paths.
- Browser upload progress depends on Axios support -> Use existing API client patterns and fall back to an uploading state if precise progress is unavailable.
