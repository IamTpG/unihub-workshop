## 1. Shared Contracts and Dependencies

- [x] 1.1 Developer A: Add `STUDENT_IMPORT_QUEUE_NAME = "student-import-queue"` to `packages/shared/src/constants/queues.ts` and export it through existing shared package entrypoints.
- [x] 1.2 Developer A: Add shared `StudentImportJobData` type with `{ importLogId: string; filePath: string }`.
- [x] 1.3 Developer A: Add CSV parser and multer dependencies/types to the relevant workspaces.

## 2. Student Import API

- [x] 2.1 Developer A: Create `apps/api/src/modules/student-import/` route/controller/service/repository/schema files following existing module patterns.
- [x] 2.2 Developer A: Configure multer disk upload for temporary CSV files with a practical size limit and cleanup on rejected requests.
- [x] 2.3 Developer A: Implement `POST /api/v1/admin/import/students` with `authenticate`, `requireRoles([Role.ADMIN])`, CSV extension/content validation, and required header validation for `studentId`, `email`, and `fullName`.
- [x] 2.4 Developer A: Create `ImportLog` with `PENDING`, enqueue the shared student import job, and return `202 { importLogId, message: "Import started" }`.
- [x] 2.5 Developer A: Implement `GET /api/v1/admin/import/logs` returning newest 20 import logs.
- [x] 2.6 Developer A: Mount student import routes at `/api/v1/admin/import` in `apps/api/src/routes/index.ts`.

## 3. Student Import Worker

- [x] 3.1 Developer B: Create `apps/worker/src/processors/student-import.processor.ts` and register it in `apps/worker/src/main.ts`.
- [x] 3.2 Developer B: Parse CSV files from disk and normalize headers/row values.
- [x] 3.3 Developer B: Validate rows for required fields and email format; count invalid rows as failed without stopping the import.
- [x] 3.4 Developer B: Implement duplicate `studentId` handling within one file using last-row-wins and count earlier duplicate rows as skipped.
- [x] 3.5 Developer B: Upsert `StudentRecord` by `studentId`, update `email`, `fullName`, and `status`, and count inserted versus updated records.
- [x] 3.6 Developer B: Detect email conflicts with a different `studentId`, count the row as failed, and avoid modifying the conflicting record.
- [x] 3.7 Developer B: Update `ImportLog` to `DONE` with final counts or `FAILED` on fatal read/parse errors, and log the import summary.
- [x] 3.8 Developer B: Delete the temporary CSV file in worker cleanup for both success and fatal failure paths.

## 4. Roster Enforcement

- [x] 4.1 Developer A: Add auth-service logic so unknown users still receive the existing generic login response.
- [x] 4.2 Developer A: Permit ADMIN and STAFF users to request OTP without a `StudentRecord`.
- [x] 4.3 Developer A: Require STUDENT users requesting OTP to have an ACTIVE `StudentRecord` matching their email; otherwise return `403` with `"Student record not found. Please contact admin."`.
- [x] 4.4 Developer B: Add registration-service eligibility check after workshop existence/status validation and before Redis slot decrement.
- [x] 4.5 Developer B: Reject STUDENT registration when no ACTIVE `StudentRecord` matches `req.user.email` with `403` and `"Your student record is not active. Please contact admin."`.
- [x] 4.6 Developer B: Confirm ineligible registration does not decrement Redis, create a registration, or enqueue a job.

## 5. Verification

- [ ] 5.1 Developer A: Add or update API tests for admin-only import endpoints, missing CSV columns, invalid file type, and import log listing.
- [ ] 5.2 Developer B: Add or update worker tests for insert/update, duplicate student IDs, invalid rows, email conflicts, fatal parse failure, and temp-file cleanup.
- [ ] 5.3 Developer A: Add or update auth tests for admin/staff bypass, active student allow, inactive/missing student deny, and unknown-user anti-enumeration.
- [ ] 5.4 Developer B: Add or update registration tests proving inactive/missing students are denied before Redis/job side effects.
- [x] 5.5 Developer A: Run API build/typecheck and relevant tests.
- [x] 5.6 Developer B: Run worker build/typecheck and relevant tests.
