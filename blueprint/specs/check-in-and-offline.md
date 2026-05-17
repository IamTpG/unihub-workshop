# Specification: Check-In & Offline Sync

## Description

**Staff** use this capability at the venue to confirm that a student with a valid ticket attended the workshop. Check-in is driven by a **QR code** on the student’s ticket (MVP: QR payload equals the registration identifier / `qrStub`). The flow must stay fast at the door and remain **usable when connectivity is poor** by queuing scans locally and syncing in batch when the network returns.

---

## Main Flow

### 1. Select workshop at the desk

1. Staff opens the check-in desk (`/manage`).
2. The system shows upcoming workshops grouped by day.
3. Staff selects a workshop and opens the scanner with that workshop’s id and title in context (optional but recommended for wrong-workshop detection).

If no workshop is selected, verification still works but cannot detect a ticket issued for a different session.

> **Dependency:** Staff need a published-workshop list they are allowed to read. Student-only discovery APIs are insufficient; provide a staff-compatible catalog or shared endpoint (see `workshops-and-discovery.md`).

### 2. Verify a ticket (online)

1. Staff scans a QR code with the device camera **or** types the token manually.
2. The system looks up the registration by QR token (`qrStub`).
3. The system returns a **structured result** (see § Results) without changing state when the ticket is invalid or not eligible.
4. When eligible (`PAID`, not yet checked in, correct workshop if context provided), the system sets `checkedInAt` (server time) **once**; concurrent duplicate scans are idempotent.

**API:** `POST /api/v1/check-ins/verify`  
Body: `{ qrToken, workshopId? }`

While a verification is in progress, duplicate submissions for the same scan are suppressed. After showing a result, the scanner resets automatically after a short delay (~3 seconds) so the next attendee can be processed.

### 3. Check-in results


| Status               | Meaning                     | User-facing message (typical)             |
| -------------------- | --------------------------- | ----------------------------------------- |
| `CHECKED_IN`         | New check-in recorded       | Welcome message with student name         |
| `ALREADY_CHECKED_IN` | Already checked in earlier  | Already checked in at {time}              |
| `INVALID_QR`         | No matching registration    | QR not recognized                         |
| `WRONG_WORKSHOP`     | Ticket for another workshop | Ticket is for a different workshop        |
| `NOT_CONFIRMED`      | Registration not `PAID`     | Registration not confirmed (shows status) |


Success responses use `success: true` even for `ALREADY_CHECKED_IN`. Failure responses use `success: false` for invalid/wrong-workshop/not-confirmed.

### 4. Operate offline or on network failure

When the browser is offline **or** verify fails with no HTTP response (network error):

1. The scan is **not** sent for immediate verification.
2. The system appends an item to a **local queue** with: unique id, `qrToken`, `workshopId`, `workshopTitle`, local timestamp, status `pending`, retry count.
3. Staff sees confirmation that the scan is queued for sync.

When verify returns **4xx** (invalid ticket, wrong workshop, not paid), the error is shown immediately and the scan is **not** queued.

Offline banner when disconnected: staff are informed that scans are stored locally.

### 5. Sync queued check-ins

When connectivity is available:

1. Pending queue items are sent in one **batch** request.
2. Each item maps to `{ registrationId: qrToken, checkedInAt: localTimestamp }` (MVP: `qrToken` is the registration UUID).
3. The system responds with:
  - `syncedIds` — registrations now checked in or already were checked in (idempotent success)
  - `failedIds` — invalid, not found, or not `PAID`
  - `processedCount`, `skippedCount` for observability

**API:** `POST /api/v1/check-ins/batch`  
Body: `{ items: [...] }` — maximum **100** items per request.

**Automatic sync:** when the browser goes online, pending items sync automatically.  
**Manual sync:** staff can trigger “Sync Now”.  
**Backoff:** if the batch request fails entirely, retry at 2s, 4s, 8s; do not retry items already marked `failed`.

Per-item retries: if a token appears in `failedIds`, increment retry count; after **3** failures mark item `failed` with reason “Max retries reached”. Staff may reset a failed item to `pending` and retry manually.

### 6. Queue management

Staff can view queue status on the scan page:

- Badge: `Queue: {pending} pending | {failed} failed`
- Panel: workshop name, scanned time, status, failure reason
- Actions: Sync Now, Retry on failed items

Queue is persisted under `unihub:checkin-queue` in browser storage. Corrupted storage resets to an empty queue. Items older than **48 hours** are pruned on load.

### 7. Legacy single check-in by registration id

For direct integration or tests, the system also accepts:

**API:** `POST /api/v1/check-ins/:registrationId`

Same eligibility rules (`PAID`, idempotent if already checked in). Prefer **verify** + QR for staff UX.

---

## Access Control

Check-in APIs require authentication and role `**STAFF`** or `**ADMIN**`.

- `STUDENT` → `403`, no state change  
- Unauthenticated → `401`

---

## Eligibility Rules

A registration may be checked in only when:

- It exists  
- `status === PAID`  
- `checkedInAt` is null (first check-in), **or** already set (idempotent read)

Optional `workshopId` on verify must match the registration’s workshop or the system returns `WRONG_WORKSHOP` without updating.

---

## Data Model

**Registration** (relevant fields):

```
checkedInAt  DateTime?   -- set on successful check-in
qrStub       String?     -- equals registration id in MVP; encoded in student QR
status       must be PAID for new check-in
```

**Offline queue item** (browser local):

```
id, qrToken, workshopId, workshopTitle, localTimestamp, expiresAt,
syncStatus: pending | synced | failed,
retryCount, failureReason?
```

---

## Error Scenarios


| Scenario                          | Behavior                                         |
| --------------------------------- | ------------------------------------------------ |
| Student calls check-in API        | `403`                                            |
| Invalid QR / unknown registration | `INVALID_QR`, not queued on 4xx                  |
| Ticket for wrong workshop         | `WRONG_WORKSHOP`, not queued                     |
| Not paid / holding / expired      | `NOT_CONFIRMED`, not queued                      |
| Already checked in                | `ALREADY_CHECKED_IN`, timestamp unchanged        |
| Batch > 100 items                 | `400` validation                                 |
| Batch: mix of valid and invalid   | Valid rows committed; invalid ids in `failedIds` |
| Batch: already checked in         | Id in `syncedIds`, no timestamp overwrite        |
| Network error on verify           | Queue locally                                    |
| Batch sync network failure        | Backoff retry whole batch                        |
| Item fails 3 batch attempts       | `failed` in local queue                          |
| Corrupt localStorage queue        | Reset to `[]`                                    |


---

## Constraints

- **Idempotent check-in:** never overwrite an existing `checkedInAt`.
- **Atomic batch:** eligible updates in one transaction; per-row `UPDATE WHERE checkedInAt IS NULL` avoids double-stamp under concurrency.
- **No service worker / IndexedDB** in MVP — `localStorage` queue only.
- **QR encoding:** MVP uses registration UUID as token; batch sync keys off the same value.
- **4xx verify errors are not offline-retried** — they are business failures, not connectivity failures.
- Check-in does not change registration `status` (remains `PAID`).
- Venue staff UX is mobile-first web (`/manage`, `/manage/scan`), not a native app.

---

## Acceptance Criteria

- STAFF and ADMIN can call verify and batch; STUDENT cannot.
- Valid `PAID` ticket checks in once; second scan returns `ALREADY_CHECKED_IN`.
- Invalid, wrong workshop, and not-confirmed tickets return correct status without check-in.
- Optional `workshopId` rejects tickets for other workshops.
- Offline scan queues item; online 4xx does not queue.
- Reconnect or “Sync Now” sends batch; `syncedIds` / `failedIds` update queue correctly.
- Already-checked-in rows in batch appear in `syncedIds`.
- Batch rejects more than 100 items.
- Failed items reach `failed` after 3 attempts; manual retry resets to pending.
- Queue badge and panel reflect pending/failed counts.
- Camera and manual entry both trigger verify when online.
- Result screen auto-clears for next scan.
- Staff desk passes workshop context into scan page when selecting from list.

