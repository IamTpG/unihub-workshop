## MODIFIED Requirements

### Requirement: Notification worker processor
The system SHALL consume notification jobs from a queue, persist the notification to the `Notification` table, and then publish notification events to Redis Pub/Sub channels scoped per user. Persistence SHALL occur before the pub/sub publish. `NotificationJobData` SHALL carry `userId`, `type`, `title`, and optional `body`. `workshopId` and `registrationId` remain on the job data for context but are not persisted to the `Notification` table.

#### Scenario: Notification job processed successfully
- **WHEN** a notification job is processed
- **THEN** the processor inserts a row into the `notifications` table with `userId`, `type`, `title`, `body`, and `isRead = false`
- **AND** the processor publishes a JSON event to the user's Redis channel

#### Scenario: DB persistence fails
- **WHEN** the Prisma insert fails
- **THEN** the job throws without publishing to Redis
- **AND** BullMQ retries the job according to its retry policy

#### Scenario: Redis publish fails after successful DB insert
- **WHEN** the Prisma insert succeeds but `redis.publish` throws
- **THEN** the notification row is already persisted in the database
- **AND** the job throws so BullMQ retries (real-time delivery is best-effort; the notification is visible via the REST history endpoint)
