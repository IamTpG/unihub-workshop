## Why

UniHub needs the imported student roster to become an enforceable source of truth, not just a database schema. This closes a core course requirement: student data must flow one way from CSV import, and only active imported students should be able to access student workflows such as OTP login and workshop registration.

## What Changes

- Add an ADMIN-only student CSV import API that accepts multipart `.csv` uploads, validates required columns, creates an `ImportLog`, and enqueues background processing.
- Add a BullMQ student import queue and worker processor that parses CSV rows, handles duplicate student IDs in the same file with last-row-wins semantics, upserts `StudentRecord` rows, updates final `ImportLog` counts, logs a summary, and deletes the temporary file.
- Add an ADMIN-only import logs API returning the 20 newest import logs.
- Enforce imported roster membership in OTP login for non-admin/non-staff users before sending an OTP.
- Enforce active imported student status when a student initiates workshop registration.
- Add CSV parsing/upload dependencies as needed.

Non-goals:

- No frontend import UI in this change.
- No nightly scheduled import in this change.
- No external legacy-system API integration; CSV remains the only student data source.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `student-import`: implement CSV upload, import queue, worker processing, duplicate handling, import logs API, and final import status/count behavior.
- `otp-login`: require non-admin/non-staff users requesting OTP to have an ACTIVE imported student record while preserving anti-enumeration behavior for unknown users.
- `workshop-registration`: require STUDENT users initiating registration to have an ACTIVE imported student record before taking a seat or enqueueing registration work.

## Impact

- Affected API modules: `apps/api/src/modules/student-import/`, `apps/api/src/modules/auth/`, `apps/api/src/modules/registrations/`, `apps/api/src/routes/index.ts`.
- Affected worker modules: `apps/worker/src/processors/`, `apps/worker/src/main.ts`.
- Affected shared package: `packages/shared/src/constants/queues.ts`, shared job payload types.
- Affected database models: existing `StudentRecord` and `ImportLog` Prisma models.
- Runtime dependencies: CSV parser and multipart upload handling via multer.
