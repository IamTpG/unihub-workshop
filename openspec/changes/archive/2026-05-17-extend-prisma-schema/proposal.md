## Why

The current Prisma schema lacks registration window controls, in-app notifications, a canonical student roster, and import audit logging. These gaps block features needed for the admin import flow, student notification delivery, and registration time-gating.

## What Changes

- Add `registrationOpenAt` and `registrationCloseAt` optional fields to the `Workshop` model to support time-gated registration windows.
- Add `CANCELLED` to the `RegStatus` enum so cancellations are tracked as a first-class state rather than repurposing `EXPIRED` or `FAILED`.
- Introduce the `Notification` model to persist in-app notifications (e.g., registration confirmations) per user.
- Introduce the `StudentRecord` model as the canonical source-of-truth for institutionally imported students.
- Introduce the `ImportLog` model to record metadata and outcomes for each student import batch.

## Capabilities

### New Capabilities

- `student-import`: Import student roster from CSV/spreadsheet into `StudentRecord`; each run creates an `ImportLog` entry tracking inserted/updated/skipped/failed counts.
- `in-app-notifications`: Persist and surface per-user notifications (e.g., `REGISTRATION_CONFIRMED`) via the `Notification` model.

### Modified Capabilities

- `workshop-registration`: `RegStatus` gains a `CANCELLED` value; `Workshop` gains optional registration window fields that gate when students may register.

## Impact

- **packages/db**: `schema.prisma` updated; new migration generated; `src/index.ts` exports updated for `Notification`, `StudentRecord`, `ImportLog`.
- **No app code changes** — existing API, worker, and web code is untouched by this change.
- **Database**: Non-destructive; existing rows unaffected. New columns are nullable or have defaults.
