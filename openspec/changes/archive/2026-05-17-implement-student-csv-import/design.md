## Context

The schema stage already introduced `StudentRecord` and `ImportLog`, but the application does not yet provide CSV ingestion or enforce the roster during student workflows. The API currently uses Express modules with route/controller/service/repository separation, role checks via `authenticate` and `requireRoles`, Redis-backed BullMQ queues, and a separate worker process that registers processors in `apps/worker/src/main.ts`.

This change crosses API, worker, shared types, and auth/registration enforcement. It must keep the data integration one-way: imported CSV data is the only source for student roster eligibility, and the system must not call an external legacy student API.

Critical flows:

1. Admin import starts: ADMIN uploads CSV to `POST /api/v1/admin/import/students` -> multer stores temp file -> API validates file type and required header columns -> API creates `ImportLog` with `PENDING` -> API enqueues `{ importLogId, filePath }` on `student-import-queue` -> API returns `202`.
2. Worker import runs: worker reads file -> parses rows -> validates row data -> collapses duplicate `studentId` entries so the last row wins -> upserts `StudentRecord` by `studentId` -> tracks inserted/updated/skipped/failed -> updates `ImportLog` to `DONE` or `FAILED` -> logs summary -> deletes temp file.
3. Login gate: login request looks up user as today -> unknown user returns the existing generic response -> ADMIN/STAFF users continue to receive OTP -> STUDENT users must have matching ACTIVE `StudentRecord.email` before OTP is generated.
4. Registration gate: after workshop existence/status checks and before Redis slot decrement, STUDENT registration verifies `req.user.email` maps to ACTIVE `StudentRecord`; ineligible students receive 403 and no seat is touched.

## Goals / Non-Goals

**Goals:**

- Implement the student CSV import API and worker using the existing modular monolith and BullMQ patterns.
- Keep imports resilient: malformed rows are counted and skipped without crashing the whole import when possible.
- Enforce ACTIVE imported roster membership in login and registration.
- Preserve anti-enumeration behavior for unknown login users.
- Make import results observable through `ImportLog` counts and console summary logs.

**Non-Goals:**

- No frontend import screen.
- No nightly scheduler.
- No external API sync with a legacy system.
- No schema redesign beyond using the existing `StudentRecord` and `ImportLog` models.

## Decisions

1. Use a dedicated `student-import-queue`.

   Rationale: import processing can take longer than an HTTP request and should not block the admin API. This matches the existing registration/payment-timeout/notification worker pattern.

   Alternative considered: process CSV synchronously in the API. Rejected because large files would tie up request workers and make failure isolation worse.

2. Validate CSV headers in the API before queueing.

   Rationale: missing required columns are fast, deterministic request validation errors. Returning `400` before creating a job gives the admin immediate feedback and avoids useless worker jobs.

   Alternative considered: let the worker detect missing columns. Rejected because the API requirement explicitly calls for a clear `400` response listing missing columns.

3. Store uploads temporarily on local disk and delete them in the worker.

   Rationale: the project currently does not have object storage. Local temp files are sufficient for the MVP/demo and match the requested multer pattern.

   Alternative considered: store CSV contents in the database. Rejected because it bloats the database and complicates cleanup.

4. Treat duplicate `studentId` rows in the same file as last-row-wins before DB writes.

   Rationale: this gives deterministic behavior and avoids repeated updates for the same student in one import. Rows replaced by a later duplicate should count as skipped so the summary reflects that not every physical row produced a write.

   Alternative considered: fail duplicate student IDs. Rejected because the requirement says duplicates within the same file must be handled clearly and last row wins.

5. Upsert by `studentId` and handle email conflicts as row failures.

   Rationale: `studentId` is the institutional identity. Since `email` is also unique, an email belonging to a different student cannot be updated safely and should be counted as failed without changing existing data.

   Alternative considered: upsert by email. Rejected because it could overwrite the wrong institutional student identity.

6. Enforce roster eligibility before side effects.

   Rationale: login must not send OTP to inactive/unimported students, and registration must not decrement Redis or enqueue registration jobs for ineligible students.

   Alternative considered: check eligibility in the registration worker. Rejected because it would allow ineligible requests to reserve soft slots temporarily and create confusing async failures.

## Risks / Trade-offs

- Local temp files can be orphaned if the API process dies after upload but before enqueue succeeds -> Delete the temp file on API validation/enqueue failures and in worker `finally`.
- Very large CSV files can consume memory if parsed all at once -> Use a parser library and keep the first implementation simple; cap upload size in multer config if needed.
- Existing `ImportLog` has no `completedAt` or error message field -> For MVP, use `status` and counts plus console logs; add richer fields in a later schema change if reporting needs it.
- Login anti-enumeration can conflict with clear student-roster errors -> Return the specific 403 only after a matching user exists and is a student; unknown users keep the generic 200 response.
- Email uniqueness conflicts can occur during upsert -> Check by email before write or catch Prisma unique errors and count the row as failed.
- Worker retry after partial DB writes can double-count if not careful -> Compute counts for a single run and update the `ImportLog` once at the end; upsert makes row writes idempotent, but final counts are based on the latest attempt.
