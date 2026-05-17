# Specification: In-App Notifications

## Description

Authenticated users receive **in-app notifications** about registration and payment lifecycle events (confirmation, payment success/failure, hold expiry, payment retry). Notifications are **stored per user** so history survives page refresh, and **delivered in real time** when the user has the app open.

Delivery uses two channels together:

1. **History** — latest notifications via REST (newest first, unread count).  
2. **Live stream** — Server-Sent Events (SSE) for immediate badge updates.

---

## Main Flow

### 1. Event produces a notification

When a registration or payment milestone completes, the system enqueues a notification job with:

- `userId` — recipient  
- `type`, `title`, `body` (optional) — display content  
- `workshopId`, `registrationId` — context for workers (not shown as separate persisted fields on the notification row)

**Standard notification types**

| Type | Typical trigger | Title (example) |
|------|-----------------|-----------------|
| `REGISTRATION_CONFIRMED` | Free workshop → `PAID` | Registration Confirmed |
| `PAYMENT_SUCCESS` | Payment webhook succeeded | Payment Successful |
| `PAYMENT_FAILED` | Payment webhook failed | Payment Failed |
| `REGISTRATION_EXPIRED` | 30-minute hold timeout | Reservation Expired |
| `PAYMENT_RETRY` | Payment intent unavailable, seat held | Payment Pending |

### 2. Persist then broadcast

For each notification job:

1. Insert (or idempotently upsert) a row in `notifications` for the user: `type`, `title`, `body`, `isRead = false`.
2. Publish a JSON event to the user’s real-time channel (`notifications:user:{userId}`).

If persistence fails, the job retries and nothing is published. If publish fails after persistence, the job retries; the user can still see the notification via history.

### 3. User sees notification history

1. On sign-in, the system loads the user’s **latest 20** notifications (newest first) and the **unread count**.
2. The notification center (bell icon) shows a badge when `unreadCount > 0`.
3. Opening the dropdown lists title, body snippet, relative time, and an unread indicator.

**API:** `GET /api/v1/notifications`  
Response: `{ items, total, unreadCount }` — each item: `id`, `type`, `title`, `body`, `isRead`, `createdAt`.

Only the authenticated user’s own rows are returned.

### 4. User receives live updates

1. While authenticated, the client opens an SSE connection to `GET /api/v1/notifications/stream`.
2. New events prepend to the local list and increment the unread badge without a full page reload.
3. If the connection drops, the client reconnects; optional replay uses `Last-Event-ID` to flush notifications created after the last seen id (up to 50).
4. A keepalive comment is sent about every **30 seconds** when idle.
5. On logout, the stream closes and notification state is cleared.

### 5. Mark as read

- **Single:** `POST /api/v1/notifications/:id/read` — owner only; sets `isRead = true`.
- **All:** `POST /api/v1/notifications/read-all` — marks all unread for the user; returns `{ updated }`.

Clicking an item in the dropdown marks it read. “Mark all as read” clears the badge.

The notification center appears in both **student mobile** and **admin** shells (top bar).

---

## Access Control

| API | Who |
|-----|-----|
| `GET /notifications`, `POST .../read`, `POST .../read-all` | Any authenticated role (own data only) |
| `GET /notifications/stream` | Authenticated via SSE-compatible auth |

- Unauthenticated → `401`  
- Mark another user’s notification → `403`  
- Unknown notification id → `404`

---

## Data Model

```
Notification {
  id              uuid PK
  userId          uuid FK → users (cascade delete)
  type            string
  title           string
  body            text nullable
  isRead          boolean default false
  idempotencyKey  string unique nullable  // dedupe job retries
  createdAt       datetime
}
```

Deleting a user removes their notifications.

---

## Notification Center Behavior

| Behavior | Requirement |
|----------|-------------|
| Bell badge | Shows unread count when > 0; hidden when 0 |
| Dropdown | Toggle on bell click; close on outside click or Escape |
| Empty state | “No notifications yet” |
| Item click | Mark that notification read |
| Mark all | Clear all unread locally and via API |
| Loading | History fetch shows loading state where applicable |

Clicking a notification does **not** navigate to a related screen in MVP.

---

## Error Scenarios

| Scenario | Behavior |
|----------|----------|
| No JWT on REST | `401` |
| No user on SSE | Connection rejected |
| User has zero notifications | `{ items: [], total: 0, unreadCount: 0 }` |
| Mark read on others’ notification | `403` |
| SSE setup failure | `500`, connection ends |
| DB insert fails on job | Job retries; no publish |
| Redis publish fails after insert | Job retries; history still has row |
| Missed live event while offline | Visible after next `GET /notifications` or SSE replay |

---

## Constraints

- **Persist before publish** — history is source of truth for “what happened.”
- **Per-user isolation** — no cross-user leakage in list or stream.
- **List cap:** 20 most recent items per request (total count may be higher).
- **No duplicate rows** from job retries — idempotency key per job.
- **In-app only** — no external notification channels in this phase.
- **Best-effort real-time** — if SSE misses an event, REST backfill covers it.
- All roles that authenticate (student, staff, admin) may have notifications; producers today focus on **student** registration events.

---

## Acceptance Criteria

- Registration/payment milestones enqueue jobs with `type`, `title`, and `body`.
- Each processed job creates a `Notification` row with `isRead = false`.
- Live channel receives JSON after successful persist.
- `GET /notifications` returns newest 20, correct `unreadCount`, own rows only.
- `POST .../read` and `read-all` update read state; forbidden for other users' ids.
- SSE connects for authenticated user, sends keepalive, cleans up on disconnect.
- Bell badge reflects unread count; mark read updates badge.
- Dropdown shows list, empty state, mark all, and close behaviors.
- Logout closes SSE and resets store.
- User deleted → notifications cascade removed.
