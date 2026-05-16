## Why

Staff check-in needs to keep working at venues with unreliable connectivity. This slice matters for the course requirements because it demonstrates offline-first workflow design, data integrity through idempotent sync, and a usable mobile staff experience without adding service worker complexity.

## What Changes

- Add a localStorage-backed offline check-in queue for staff QR scans.
- Add automatic background sync when the device comes back online.
- Add retry handling with exponential backoff and a manual retry path for failed queued scans.
- Update the staff scan page with offline status, queue counts, and queue management UI.
- Treat network failures during online scan verification as queueable events instead of hard failures.
- Clarify the batch check-in API contract used by offline sync.
- Non-goals: no service worker, no IndexedDB, no new native mobile app, and no change to QR token generation.

## Capabilities

### New Capabilities
- `offline-checkin-queue`: Local offline queue, automatic sync, retry handling, and staff scan page queue UI for check-ins.

### Modified Capabilities
- `checkin-api`: Clarify batch check-in response semantics required for idempotent offline sync.

## Impact

- Web app: `apps/web/src/pages/staff/Scan.tsx`, new `apps/web/src/lib/offlineQueue.ts`, and new sync hook under `apps/web/src/hooks/`.
- API contract: `POST /api/v1/check-ins/batch` remains the sync endpoint and must expose stable `syncedIds` and `failedIds` semantics.
- Storage: browser `localStorage` key `unihub:checkin-queue`.
- Dependencies: no required new backend services; no service worker or IndexedDB dependency.
