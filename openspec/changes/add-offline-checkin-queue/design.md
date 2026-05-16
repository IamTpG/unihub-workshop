## Context

The staff scan page can verify QR tokens online, and the backend already exposes `POST /api/v1/check-ins/batch` for offline sync. Staff devices may lose connectivity during venue check-in, so scans must be captured locally and synchronized when connectivity returns. The constraint is to use responsive web behavior only: no service worker, no IndexedDB, and no native mobile layer.

## Goals / Non-Goals

**Goals:**
- Queue scans locally when the browser is offline or an online verification request fails due to a network error.
- Keep the staff scan flow fast by showing immediate queued confirmation rather than blocking on connectivity.
- Sync pending scans automatically when the browser returns online.
- Preserve idempotency by using the scanned `qrToken` as the batch `registrationId`, matching the current `qrStub === registrationId` design.
- Give staff visibility into pending, synced, and failed queue items and allow manual retry.

**Non-Goals:**
- No service worker or background sync API.
- No IndexedDB persistence.
- No frontend route changes beyond the existing `/manage/scan` page.
- No change to QR token generation.
- No new backend endpoint unless the existing batch response contract is incomplete.

## Decisions

1. Use a small localStorage utility for queue persistence.
   - Rationale: the queue is small, scoped to one device, and the project constraint explicitly avoids service workers and IndexedDB.
   - Alternative considered: IndexedDB. Rejected because it adds implementation overhead and is outside scope.

2. Store all queue items with a client-generated UUID idempotency key and the scanned QR token.
   - Rationale: the UI needs a stable local row id while the backend batch endpoint uses `registrationId`. The current QR token equals `registrationId`, so no token translation layer is needed.
   - Alternative considered: use `qrToken` as the local id. Rejected because duplicate scans of the same registration need distinct local timestamps and retry state until the backend resolves idempotently.

3. Implement sync as a React hook used by `Scan.tsx`.
   - Rationale: the sync lifecycle is coupled to browser online/offline events and the scan page UI, but the batching logic should remain testable outside the component.
   - Alternative considered: embed all sync logic in `Scan.tsx`. Rejected because it would make the scan component harder to maintain.

4. Treat batch `syncedIds` as authoritative success results.
   - Rationale: the backend already owns check-in eligibility and idempotency. If an item is already checked in, the offline queue can still mark it synced because the desired final state is satisfied.
   - Alternative considered: inspect `skippedCount` only. Rejected because counts cannot identify which local queue entries to update.

5. Keep failed items in localStorage until staff retries or removes them.
   - Rationale: automatic retries should not loop forever on invalid tickets or persistent backend rejection. A visible failed state is better for operations.
   - Alternative considered: delete failed items after max retries. Rejected because it hides data loss risk.

Critical flows:

1. Offline scan
   - Staff scans or manually enters a QR token.
   - `Scan.tsx` sees `navigator.onLine === false`.
   - The page writes a pending queue item to localStorage and shows "Queued (offline) - will sync when connected".
   - No API call is attempted.

2. Online scan with network failure
   - Staff scans while `navigator.onLine === true`.
   - The verify API request fails without an HTTP response.
   - The page queues the scan with pending status and shows "Network error - scan queued for sync".

3. Automatic sync
   - The hook runs on mount and on the browser `online` event.
   - Pending items are sent once to `POST /api/v1/check-ins/batch`.
   - Items in `syncedIds` are marked `synced`.
   - Items in `failedIds` increment `retryCount`; after three attempts they become `failed` with reason "Max retries reached".
   - If the whole request fails, the hook retries with 2s, 4s, and 8s backoff.

4. Manual retry
   - Staff opens the queue panel and selects Retry on a failed item.
   - The item is reset to `pending` with `retryCount: 0`.
   - Staff can trigger Sync Now or wait for the next automatic online sync.

## Risks / Trade-offs

- [Risk] localStorage is device-local and can be cleared by the browser -> Mitigation: show queue counts and failed items clearly so staff can spot unsynced work during the session.
- [Risk] batch API response may not identify duplicate/already checked-in records as synced -> Mitigation: clarify `syncedIds` semantics in the check-in API spec and verify the backend behavior before relying on it.
- [Risk] browser `online` can be true while the API is unreachable -> Mitigation: treat network errors as retryable and use bounded exponential backoff.
- [Risk] duplicate scans can produce multiple queue entries -> Mitigation: backend check-in remains idempotent and duplicate/already checked-in results are treated as synced.
- [Risk] corrupted localStorage can break the scan page -> Mitigation: queue parsing catches errors, resets to an empty queue, and allows scanning to continue.
