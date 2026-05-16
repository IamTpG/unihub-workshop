## Context

The current notification system is ephemeral: `notification.processor.ts` publishes a JSON payload to a Redis pub/sub channel (`notifications:user:{userId}`), which the SSE handler forwards to connected clients. If a user is not connected at the moment an event fires, the notification is permanently lost.

The `Notification` table exists in the DB (Stage 1 migration complete). `NotificationJobData` in `packages/shared` carries `userId`, `workshopId`, `registrationId`, and `type` — but no `title` or `body`. All callers (registration processor, payment-timeout processor, payment-webhook controller) build the job data inline.

Notification type names in use today (`REGISTRATION_PAID`, `REGISTRATION_FAILED`, `REGISTRATION_EXPIRED`, `PAYMENT_RETRY`) differ from the user-facing names required. These will be updated as part of this change.

## Goals / Non-Goals

**Goals:**
- Every notification job results in a DB row before pub/sub delivery
- `NotificationJobData` carries structured `type`, `title`, and `body`
- Three REST endpoints allow the frontend to load history and manage read state
- A polished notification center in both Admin and Mobile shells shows history + live updates

**Non-Goals:**
- No push/email delivery
- No deep-link routing on notification click
- No pagination beyond latest-20 (no infinite scroll or cursor)
- No admin-side notification management

## Decisions

### 1. Persist in the processor, not at enqueue time

Persistence happens inside `notification.processor.ts` (the BullMQ consumer), not at job enqueue time. This keeps all callers thin and ensures persistence is centralized in one place.

**Failure isolation:** If the Prisma insert fails, the job throws and BullMQ retries. If Redis publish fails after a successful insert, the notification is already in the DB — the SSE miss is acceptable. The sequence is:
1. `prisma.notification.create(…)` ← persists first
2. `redis.publish(channel, payload)` ← real-time delivery
3. If publish fails: log + throw (BullMQ retries the whole job; the next attempt may duplicate the DB row if not idempotent — see Risk section)

### 2. NotificationJobData extended, type names updated

Add `title: string` and `body?: string` to `NotificationJobData`. Update the `type` union:
- `REGISTRATION_PAID` → `REGISTRATION_CONFIRMED` (free or paid registration completed)
- `REGISTRATION_FAILED` → `PAYMENT_FAILED` (payment webhook failed)
- `REGISTRATION_EXPIRED` → keep as-is (payment timeout)
- `PAYMENT_RETRY` → keep as-is (payment intent failed, seat held)

All callers are updated in the same change. The type string is also stored in the DB `type` column so the values must be stable after deploy.

### 3. API: single controller + service, no separate repository

The notification queries are simple (findMany with userId filter, updateMany). A thin `notifications.service.ts` + `notifications.controller.ts` is sufficient. No separate repository layer for MVP.

### 4. REST list endpoint returns unreadCount in the same call

`GET /notifications` returns `{ items, total, unreadCount }`. The unreadCount avoids a separate round-trip for badge state on app load.

### 5. Frontend: EventSource for SSE, not a custom polling loop

`EventSource` natively reconnects. The store wraps it minimally: on `message`, parse and prepend. The store is initialized once in the auth bootstrap and torn down on logout.

### 6. NotificationCenter as a dropdown, not a page

A fixed-position dropdown avoids route changes and keeps the UX snappy. Outside-click and Escape key close it. This is simpler to implement than a drawer or modal for a 4-evening timeline.

## Risks / Trade-offs

- **Duplicate DB rows on BullMQ retry after publish failure** → Acceptable for MVP. The notification appears twice in history, which is a minor cosmetic issue. A future fix: use `upsert` with an `idempotencyKey` derived from the job ID.
- **SSE reconnect during offline period misses real-time events** → Mitigated by history load on connect/reconnect via `fetchNotifications()`.
- **EventSource auth on Mobile (cookies vs. token header)** → SSE uses EventSource which only supports cookies for auth. The existing `/stream` endpoint uses cookie-based JWT (or token in query param). Verify auth middleware allows both modes; if not, fall back to query-param token for SSE only.

## Migration Plan

1. Deploy shared package change (`NotificationJobData` extended).
2. Deploy worker (notification processor + all processor callers).
3. Deploy API (new notification routes).
4. Deploy frontend.
5. No DB migration needed — `Notification` table exists.
6. Verify: create a free-workshop registration, confirm `notifications` table gets a row, and the student's notification center shows it.
