## 1. Developer A - Queue Utility

- [x] 1.1 Create `apps/web/src/lib/offlineQueue.ts` with the queue item type, storage key, and localStorage read/write helpers.
- [x] 1.2 Implement `enqueue`, `getAll`, `updateItem`, `removeItem`, and `getPendingItems` with graceful recovery from corrupted JSON.
- [x] 1.3 Add a small notification mechanism or reload helper so UI consumers can refresh queue state after queue mutations.

## 2. Developer A - Sync Hook

- [x] 2.1 Create `apps/web/src/hooks/useOfflineSync.ts` that reads pending items on mount and listens for browser `online` events.
- [x] 2.2 Implement batch sync to `POST /api/v1/check-ins/batch`, mapping queue items to `{ registrationId: qrToken, checkedInAt: localTimestamp }`.
- [x] 2.3 Process `syncedIds` and `failedIds`, marking synced items, incrementing retry counts, and marking max-retry items as failed.
- [x] 2.4 Add immediate reconnect sync plus 2s, 4s, and 8s backoff for sync request failures.
- [x] 2.5 Expose queue state, pending/failed counts, `syncNow`, and failed-item retry helpers from the hook.

## 3. Developer B - Scan Page Offline Flow

- [x] 3.1 Update `apps/web/src/pages/staff/Scan.tsx` to track `navigator.onLine` with `online` and `offline` event listeners.
- [x] 3.2 Show the persistent offline banner when offline.
- [x] 3.3 Queue scans directly when offline and show "Queued (offline) - will sync when connected".
- [x] 3.4 Detect network errors from online verify requests and queue the scan with "Network error - scan queued for sync".
- [x] 3.5 Preserve existing 4xx/API result handling without queueing invalid online responses.

## 4. Developer B - Queue UI

- [x] 4.1 Add the queue badge near the top of the scan page using pending and failed counts.
- [x] 4.2 Add a "Show Queue" control and an inline panel or bottom sheet listing all queue items.
- [x] 4.3 Display workshop name, scanned time, color-coded status, and failure reason for each queue item.
- [x] 4.4 Add "Sync Now" and failed-item "Retry" controls wired to the sync hook.
- [x] 4.5 Ensure queue panel state updates after enqueue, sync, and retry actions.

## 5. API Contract Verification

- [x] 5.1 Verify `POST /api/v1/check-ins/batch` returns `processedCount`, `skippedCount`, `syncedIds`, and `failedIds`.
- [x] 5.2 Adjust backend batch behavior if needed so already checked-in registrations are idempotent successes in `syncedIds`.
- [x] 5.3 Confirm invalid or ineligible batch items are returned in `failedIds` without blocking valid items.

## 6. Validation

- [x] 6.1 Run the web build or relevant TypeScript check.
- [x] 6.2 Run the API build or relevant TypeScript check if backend batch behavior changed.
- [ ] 6.3 Manually verify offline scan queueing, reconnect sync, network-error fallback, failed retry, and corrupted localStorage recovery.
