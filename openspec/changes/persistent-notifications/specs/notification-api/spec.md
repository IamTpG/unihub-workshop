## ADDED Requirements

### Requirement: Authenticated users can list their notifications
The system SHALL expose `GET /api/v1/notifications` for any authenticated user. The endpoint SHALL return the user's notifications ordered by `createdAt` descending, limited to the most recent 20. The response SHALL include `items`, `total`, and `unreadCount`.

#### Scenario: User fetches notification list
- **WHEN** an authenticated user calls `GET /api/v1/notifications`
- **THEN** the system returns `{ items: Notification[], total: number, unreadCount: number }`
- **AND** items are ordered newest first
- **AND** each item contains `id`, `type`, `title`, `body`, `isRead`, and `createdAt`

#### Scenario: User with no notifications
- **WHEN** an authenticated user has no notification rows
- **THEN** the system returns `{ items: [], total: 0, unreadCount: 0 }`

#### Scenario: Unauthenticated request is rejected
- **WHEN** a request to `GET /api/v1/notifications` has no valid JWT
- **THEN** the system returns `401 Unauthorized`

#### Scenario: Notifications from other users are excluded
- **WHEN** an authenticated user calls `GET /api/v1/notifications`
- **THEN** the system returns only notifications whose `userId` matches the authenticated user's id

### Requirement: User can mark a single notification as read
The system SHALL expose `POST /api/v1/notifications/:id/read`. Only the notification's owner SHALL be able to mark it as read.

#### Scenario: Notification marked as read successfully
- **WHEN** an authenticated user posts to `/notifications/:id/read` for a notification they own
- **THEN** the system sets `isRead = true` on that notification
- **AND** returns the updated notification object

#### Scenario: Marking another user's notification is rejected
- **WHEN** an authenticated user posts to `/notifications/:id/read` for a notification owned by a different user
- **THEN** the system returns `403 Forbidden` and does not modify the notification

#### Scenario: Notification not found
- **WHEN** an authenticated user posts to `/notifications/:id/read` for a non-existent id
- **THEN** the system returns `404 Not Found`

### Requirement: User can mark all notifications as read
The system SHALL expose `POST /api/v1/notifications/read-all` to mark every unread notification for the requesting user as read in a single operation.

#### Scenario: All notifications marked as read
- **WHEN** an authenticated user posts to `/notifications/read-all`
- **THEN** the system updates all `isRead = false` rows for that user to `isRead = true`
- **AND** returns `{ updated: number }` with the count of rows changed

#### Scenario: No unread notifications
- **WHEN** an authenticated user posts to `/notifications/read-all` and all notifications are already read
- **THEN** the system returns `{ updated: 0 }` with no error
