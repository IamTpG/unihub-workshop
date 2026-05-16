## ADDED Requirements

### Requirement: System persists notifications per user
The system SHALL store in-app notifications in the `Notification` table, associated with a `User` via `userId`. Each notification SHALL have a `type`, `title`, optional `body`, and an `isRead` flag defaulting to `false`.

#### Scenario: Notification created for a user
- **WHEN** a system event (e.g., registration confirmed) triggers a notification
- **THEN** a row is inserted into `notifications` with the correct `userId`, `type`, `title`, and `isRead = false`

#### Scenario: Notification body is optional
- **WHEN** a notification is created without a body
- **THEN** the row is inserted with `body = NULL` and no error is raised

### Requirement: Notifications are scoped to the owning user
The `Notification` model SHALL enforce a foreign key relation to `User` with cascade delete, so that deleting a user also removes their notifications.

#### Scenario: User deleted removes notifications
- **WHEN** a `User` row is deleted from the database
- **THEN** all `Notification` rows with the matching `userId` are also deleted via cascade

#### Scenario: Notification references non-existent user
- **WHEN** an attempt is made to insert a `Notification` with a `userId` that does not exist in `users`
- **THEN** the database rejects the insert with a foreign key constraint violation
