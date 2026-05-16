## ADDED Requirements

### Requirement: Local offline check-in queue
The web app SHALL persist staff check-in scans in a localStorage queue when scans cannot be verified online.

#### Scenario: Queue item is stored
- **GIVEN** a staff user scans a QR token while offline
- **WHEN** the scan page queues the item
- **THEN** the queue item includes `id`, `qrToken`, `workshopId`, `workshopTitle`, `localTimestamp`, `syncStatus`, and `retryCount`
- **AND** the item is persisted under the `unihub:checkin-queue` localStorage key

#### Scenario: Corrupted queue storage is handled
- **GIVEN** localStorage contains invalid JSON for `unihub:checkin-queue`
- **WHEN** the queue is read
- **THEN** the app resets the stored queue to an empty array
- **AND** the scan page remains usable

### Requirement: Offline scan handling
The staff scan page SHALL detect offline status and queue scans locally instead of attempting network verification.

#### Scenario: Offline banner is shown
- **GIVEN** the browser reports offline status
- **WHEN** staff opens the scan page
- **THEN** the page shows "You're offline - scans are queued locally"

#### Scenario: Offline scan is queued
- **GIVEN** the browser reports offline status
- **WHEN** staff scans or manually enters a QR token
- **THEN** the app does not call the verify API
- **AND** the scan is added to the offline queue with `syncStatus` set to `pending`
- **AND** staff sees "Queued (offline) - will sync when connected"

### Requirement: Network failure fallback
The staff scan page SHALL queue scans when an online verification request fails due to a network error.

#### Scenario: Online scan network error
- **GIVEN** the browser reports online status
- **WHEN** staff scans a QR token and `POST /api/v1/check-ins/verify` fails without an HTTP response
- **THEN** the scan is added to the offline queue with `syncStatus` set to `pending`
- **AND** staff sees "Network error - scan queued for sync"

#### Scenario: Online scan validation error is not queued
- **GIVEN** the browser reports online status
- **WHEN** staff scans a QR token and `POST /api/v1/check-ins/verify` returns a 4xx response
- **THEN** the app displays the check-in error result
- **AND** the scan is not added to the offline queue

### Requirement: Automatic offline queue sync
The web app SHALL automatically synchronize pending offline check-in items when connectivity is available.

#### Scenario: Pending items sync on reconnect
- **GIVEN** the queue contains pending items
- **WHEN** the browser emits an online event
- **THEN** the app sends one batch request to `POST /api/v1/check-ins/batch`
- **AND** each item is mapped to `{ registrationId: qrToken, checkedInAt: localTimestamp }`

#### Scenario: Successful sync updates item status
- **GIVEN** the batch endpoint returns `syncedIds`
- **WHEN** a queued item's `qrToken` is included in `syncedIds`
- **THEN** the item is updated to `syncStatus` `synced`

#### Scenario: Failed item reaches max retries
- **GIVEN** the batch endpoint returns a queued item's `qrToken` in `failedIds`
- **WHEN** that item's retry count reaches three attempts
- **THEN** the item is updated to `syncStatus` `failed`
- **AND** `failureReason` is set to "Max retries reached"

#### Scenario: Sync request failure retries with backoff
- **GIVEN** the queue contains pending items
- **WHEN** the batch sync request fails due to a network or server error
- **THEN** the app retries synchronization using 2 second, 4 second, and 8 second backoff delays
- **AND** it does not retry items already marked `failed`

### Requirement: Queue status and management UI
The staff scan page SHALL show queue status and allow staff to inspect and retry queued check-ins.

#### Scenario: Queue badge shows counts
- **GIVEN** the queue contains pending and failed items
- **WHEN** staff opens the scan page
- **THEN** the page shows a badge in the format "Queue: {pendingCount} pending | {failedCount} failed"

#### Scenario: Queue panel lists items
- **GIVEN** the queue contains check-in items
- **WHEN** staff opens the queue panel
- **THEN** each item displays workshop name, scanned time, status, and failure reason when present

#### Scenario: Staff triggers manual sync
- **GIVEN** the queue contains pending items
- **WHEN** staff selects "Sync Now"
- **THEN** the app immediately attempts a batch sync

#### Scenario: Staff retries failed item
- **GIVEN** the queue contains an item with `syncStatus` `failed`
- **WHEN** staff selects "Retry" for that item
- **THEN** the item is updated to `syncStatus` `pending`
- **AND** `retryCount` is reset to 0
