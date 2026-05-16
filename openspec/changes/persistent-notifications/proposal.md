## Why

Notifications are currently fire-and-forget: the worker publishes to Redis pub/sub for live SSE delivery, but nothing is saved to the database. Users who connect after an event (or refresh the page) see no history. Adding persistence plus a list/read API closes this gap and enables a polished notification center — a key demoability feature showing the full registration and payment lifecycle.

## What Changes

- Worker notification processor now saves a `Notification` row to the DB before publishing to Redis pub/sub
- `NotificationJobData` in `packages/shared` is extended with `type`, `title`, and `body` fields (all callers must send these)
- Registration worker enqueue calls are verified/updated to include structured `type`, `title`, and `body`
- Three new REST endpoints: `GET /notifications`, `POST /notifications/:id/read`, `POST /notifications/read-all`
- New Zustand notification store manages list state and SSE subscription
- New `NotificationCenter` component (bell + badge + dropdown) added to Admin and Mobile shells

**Non-goals:**
- No push/email notifications
- No per-type routing (clicking a notification does not deep-link to a specific resource)
- No pagination beyond a simple limit (load latest 20, no infinite scroll)
- No admin notification management UI

## Capabilities

### New Capabilities

- `notification-api`: REST API to fetch a user's notification list (newest first, with unread count) and mark notifications as read (single or all).
- `notification-center-ui`: Frontend Zustand store subscribing to SSE and pre-loading history via REST; `NotificationCenter` bell-badge-dropdown component; integration into Admin and Mobile shells.

### Modified Capabilities

- `sse-notifications`: Notification processor now persists a DB row before publishing to Redis pub/sub; `NotificationJobData` shape is extended to carry `type`, `title`, and `body`.
- `registration-worker`: Notification enqueue calls for free-registration confirmed, payment success, and payment failed now include the required `type`, `title`, and `body` fields.

## Impact

- **Worker**: `apps/worker/src/processors/notification.processor.ts`, `apps/worker/src/processors/registration.processor.ts`
- **Shared package**: `packages/shared` — `NotificationJobData` type extended
- **API**: `apps/api/src/modules/notifications/notifications.routes.ts` + new `notifications.controller.ts` + new `notifications.service.ts`
- **Frontend**: `apps/web/src/stores/notificationStore.ts` (new), `apps/web/src/components/notifications/NotificationCenter.tsx` (new), `apps/web/src/layout/AdminShell.tsx`, `apps/web/src/layout/MobileShell.tsx`
- **No new external dependencies** — uses existing Prisma, Redis, BullMQ, Zustand, EventSource
