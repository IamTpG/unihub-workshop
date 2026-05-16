## 1. Shared Package — NotificationJobData

- [x] 1.1 Add `title: string` and `body?: string` to `NotificationJobData` in `packages/shared/src/types/registration.ts`
- [x] 1.2 Update `NotificationJobData.type` union to include `"REGISTRATION_CONFIRMED" | "PAYMENT_SUCCESS" | "PAYMENT_FAILED" | "REGISTRATION_EXPIRED" | "PAYMENT_RETRY"` (remove old `REGISTRATION_PAID` and `REGISTRATION_FAILED` values)
- [x] 1.3 Rebuild / verify shared package exports are updated

## 2. Worker — Notification Processor Persistence

- [x] 2.1 Import Prisma client in `apps/worker/src/processors/notification.processor.ts`
- [x] 2.2 Before the Redis publish call, insert a row into `Notification` via `prisma.notification.create({ data: { userId, type, title, body: body ?? null, isRead: false } })`
- [x] 2.3 Ensure the job throws on DB failure (so BullMQ retries), and continues to publish after a successful insert

## 3. Worker — Update Notification Enqueue Callers

- [x] 3.1 In `registration.processor.ts` (free path): change type to `"REGISTRATION_CONFIRMED"`, add `title: "Registration Confirmed"`, `body: "Your spot has been reserved."`
- [x] 3.2 In `registration.processor.ts` (PAYMENT_RETRY path): add `title: "Payment Pending"`, `body: "Your seat is held for 30 minutes while we retry payment."`
- [x] 3.3 In `payment-timeout.processor.ts`: change type to `"REGISTRATION_EXPIRED"`, add `title: "Reservation Expired"`, `body: "Your seat reservation has expired. Please register again."`
- [x] 3.4 In `payment-webhook.controller.ts` (PAYMENT_SUCCEEDED path): change type to `"PAYMENT_SUCCESS"`, add `title: "Payment Successful"`, `body: "Your registration payment has been confirmed."`
- [x] 3.5 In `payment-webhook.controller.ts` (PAYMENT_FAILED path): change type to `"PAYMENT_FAILED"`, add `title: "Payment Failed"`, `body: "Your payment could not be processed. Your seat has been released."`

## 4. Backend — Notification API

- [x] 4.1 Create `apps/api/src/modules/notifications/notifications.service.ts` with three methods: `list(userId)` → `{ items, total, unreadCount }`, `markRead(userId, id)`, `markAllRead(userId)` → `{ updated }`
- [x] 4.2 Create `apps/api/src/modules/notifications/notifications.controller.ts` with handlers for `GET /`, `POST /:id/read`, `POST /read-all` that call the service
- [x] 4.3 Add the three new routes to `apps/api/src/modules/notifications/notifications.routes.ts` (all behind `authenticate` middleware)
- [x] 4.4 Verify `GET /api/v1/notifications` returns `{ items, total, unreadCount }` with items newest first, limited to 20

## 5. Frontend — Notification Type and Store

- [x] 5.1 Add `Notification` type to `apps/web/src/stores/notificationStore.ts`: `{ id: string; type: string; title: string; body: string | null; isRead: boolean; createdAt: string }`
- [x] 5.2 Create the Zustand store with state `{ notifications, unreadCount, isLoading }` and actions `fetchNotifications`, `markRead`, `markAllRead`, `addNotification`
- [x] 5.3 Implement `fetchNotifications`: call `GET /api/v1/notifications`, set `notifications` and `unreadCount` from response
- [x] 5.4 Implement `markRead(id)`: call `POST /api/v1/notifications/:id/read`, update local `isRead` and decrement `unreadCount`
- [x] 5.5 Implement `markAllRead()`: call `POST /api/v1/notifications/read-all`, set all local `isRead = true`, set `unreadCount = 0`
- [x] 5.6 Implement `addNotification(n)`: prepend to `notifications`, increment `unreadCount`
- [x] 5.7 Add SSE subscription in the store: open `EventSource` to `/api/v1/notifications/stream`, on `message` parse JSON and call `addNotification`; on reconnect call `fetchNotifications` to cover missed events
- [x] 5.8 Call `fetchNotifications()` in `ProtectedRoute` (or app bootstrap) on initial mount so history loads immediately after login

## 6. Frontend — NotificationCenter Component

- [x] 6.1 Create `apps/web/src/components/notifications/NotificationCenter.tsx` with a bell icon button and a red badge showing `unreadCount` (hidden when 0)
- [x] 6.2 Implement dropdown panel toggle on bell click; panel includes a "Notifications" header and a "Mark all as read" button
- [x] 6.3 Render a list of notification items: each shows `title`, `body` (truncated to 2 lines), relative time, and an unread dot for `isRead = false` items
- [x] 6.4 On notification item click: call `markRead(id)`, remove unread dot
- [x] 6.5 On "Mark all as read" click: call `markAllRead()`
- [x] 6.6 Render "No notifications yet" empty state when `notifications` is empty
- [x] 6.7 Close dropdown on outside click (attach click listener to `document`)
- [x] 6.8 Close dropdown on Escape key press

## 7. Frontend — Shell Integration

- [x] 7.1 Import and render `<NotificationCenter />` in `apps/web/src/layout/AdminShell.tsx` in the top-right navigation area
- [x] 7.2 Import and render `<NotificationCenter />` in `apps/web/src/layout/MobileShell.tsx` in the header/top bar

## 8. Verification

- [ ] 8.1 Trigger a free-workshop registration end-to-end; verify a row appears in the `notifications` table with `type = "REGISTRATION_CONFIRMED"` and `isRead = false`
- [ ] 8.2 Verify `GET /api/v1/notifications` returns the notification in the response
- [ ] 8.3 Verify the NotificationCenter bell shows a badge, opens the dropdown, and "mark as read" clears it
- [ ] 8.4 Verify `POST /api/v1/notifications/read-all` sets all rows to `isRead = true`
