## ADDED Requirements

### Requirement: Frontend Notification type
The web app SHALL define a `Notification` type: `{ id: string; type: string; title: string; body: string | null; isRead: boolean; createdAt: string }`.

#### Scenario: Notification type used consistently
- **WHEN** the notification store and NotificationCenter component reference notification objects
- **THEN** all references use the shared `Notification` type

### Requirement: Notification store manages history and live updates
The system SHALL provide a Zustand store at `notificationStore.ts` with state: `notifications: Notification[]`, `unreadCount: number`, `isLoading: boolean`.

#### Scenario: fetchNotifications loads history
- **WHEN** `fetchNotifications()` is called
- **THEN** the store calls `GET /api/v1/notifications`
- **AND** sets `notifications` to the returned items
- **AND** sets `unreadCount` to the returned `unreadCount`
- **AND** sets `isLoading` appropriately during the request

#### Scenario: markRead updates local state
- **WHEN** `markRead(id)` is called for a notification that is unread
- **THEN** the store calls `POST /api/v1/notifications/:id/read`
- **AND** on success, sets `isRead = true` on the matching notification in local state
- **AND** decrements `unreadCount` by 1

#### Scenario: markAllRead clears all unread
- **WHEN** `markAllRead()` is called
- **THEN** the store calls `POST /api/v1/notifications/read-all`
- **AND** on success, sets `isRead = true` on all notifications in local state
- **AND** sets `unreadCount` to 0

#### Scenario: addNotification prepends live event
- **WHEN** `addNotification(n)` is called with a new notification object
- **THEN** the notification is prepended to the `notifications` array
- **AND** `unreadCount` is incremented by 1

#### Scenario: Store initializes on app bootstrap
- **WHEN** an authenticated user loads the app (ProtectedRoute mounts)
- **THEN** `fetchNotifications()` is called to pre-load history

### Requirement: Notification store subscribes to SSE stream
The store SHALL open an `EventSource` connection to `GET /api/v1/notifications/stream` upon authentication and call `addNotification` on each received event. The connection SHALL reconnect automatically on disconnect (EventSource native behavior).

#### Scenario: Live notification received via SSE
- **WHEN** the SSE stream delivers a `data` event with a JSON notification payload
- **THEN** the store parses the payload and calls `addNotification`
- **AND** the unread count badge updates immediately

#### Scenario: SSE connection disconnects
- **WHEN** the SSE connection drops
- **THEN** EventSource automatically attempts to reconnect
- **AND** history is re-fetched via `fetchNotifications()` on reconnect to cover any missed events

#### Scenario: SSE connection closed on logout
- **WHEN** the user logs out
- **THEN** the EventSource connection is closed
- **AND** the notification store state is reset

### Requirement: NotificationCenter component renders bell with badge
The system SHALL provide a `NotificationCenter` component with a bell icon button. When `unreadCount > 0`, the button SHALL display a red numeric badge. When `unreadCount === 0`, the badge SHALL be hidden.

#### Scenario: Badge shows unread count
- **WHEN** `unreadCount` is greater than 0
- **THEN** the bell button displays a red badge with the unread count

#### Scenario: Badge hidden when all read
- **WHEN** `unreadCount` is 0
- **THEN** no badge is rendered on the bell button

### Requirement: NotificationCenter dropdown displays notification list
Clicking the bell button SHALL toggle a dropdown panel showing the notification list. The panel SHALL include a "Mark all as read" action and an empty state.

#### Scenario: Dropdown opens on bell click
- **WHEN** a user clicks the bell button
- **THEN** a dropdown panel appears with the notification list

#### Scenario: Notification item shows title, body, time, and read state
- **WHEN** the dropdown is open
- **THEN** each notification item shows the `title`, truncated `body`, a relative time ("2 min ago"), and an unread dot indicator for unread items

#### Scenario: Clicking notification marks it as read
- **WHEN** a user clicks a notification item
- **THEN** `markRead(id)` is called
- **AND** the unread dot disappears on that item

#### Scenario: Mark all as read clears badge
- **WHEN** a user clicks "Mark all as read"
- **THEN** `markAllRead()` is called
- **AND** all unread dots disappear and the badge is removed from the bell

#### Scenario: Empty state shown when no notifications
- **WHEN** the dropdown is open and `notifications` is empty
- **THEN** the panel renders "No notifications yet"

#### Scenario: Dropdown closes on outside click
- **WHEN** a user clicks outside the dropdown panel
- **THEN** the dropdown closes

#### Scenario: Dropdown closes on Escape key
- **WHEN** the dropdown is open and the user presses the Escape key
- **THEN** the dropdown closes

### Requirement: NotificationCenter integrated into application shells
The `NotificationCenter` component SHALL be rendered in both the Admin and Mobile shells.

#### Scenario: NotificationCenter in Admin shell
- **WHEN** an admin user views any admin page
- **THEN** the NotificationCenter bell is visible in the top navigation bar on the right side

#### Scenario: NotificationCenter in Mobile shell
- **WHEN** a student user views any student page
- **THEN** the NotificationCenter bell is visible in the header/top bar
