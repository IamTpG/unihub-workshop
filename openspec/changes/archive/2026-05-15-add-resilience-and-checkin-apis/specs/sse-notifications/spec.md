## ADDED Requirements

### Requirement: Notification worker processor
The system SHALL consume jobs from the `notification-queue` BullMQ queue and publish notification events to Redis Pub/Sub channels scoped per user.

#### Scenario: Notification job processed successfully
- **WHEN** a notification job with `{ userId, workshopId, registrationId, type: "REGISTRATION_PAID" }` is added to the queue
- **THEN** the notification processor publishes a JSON event to Redis channel `notifications:user:<userId>`
- **AND** the job is marked as completed in BullMQ

#### Scenario: Notification processor retries on failure
- **WHEN** the Redis PUBLISH command fails due to a transient error
- **THEN** BullMQ retries the job up to 3 times with exponential backoff (2s, 4s, 8s)

#### Scenario: No SSE client connected
- **WHEN** a notification is published to a Redis Pub/Sub channel
- **AND** no SSE client is subscribed to that channel
- **THEN** the message is silently dropped (fire-and-forget)
- **AND** no error is logged (this is expected behavior)

### Requirement: SSE endpoint for real-time notifications
The system SHALL provide `GET /api/v1/notifications/stream` as a Server-Sent Events endpoint that streams notification events to authenticated clients.

#### Scenario: Client connects to SSE stream
- **WHEN** an authenticated user sends `GET /notifications/stream`
- **THEN** the server responds with `Content-Type: text/event-stream`
- **AND** the server subscribes to Redis Pub/Sub channel `notifications:user:<userId>`
- **AND** the connection is kept alive

#### Scenario: Notification event delivered via SSE
- **WHEN** a client is connected to the SSE stream
- **AND** a notification is published to their Redis channel
- **THEN** the server writes the event as `data: <JSON payload>\n\n` to the SSE response
- **AND** the client receives the event via `EventSource.onmessage`

#### Scenario: SSE keepalive prevents connection timeout
- **WHEN** a client is connected to the SSE stream
- **AND** no notification events occur for 30 seconds
- **THEN** the server sends a keepalive comment `: keepalive\n\n`
- **AND** the connection remains open

#### Scenario: Client disconnects
- **WHEN** an SSE client closes the connection (browser tab closed, network lost)
- **THEN** the server detects the `close` event on the response
- **AND** the server unsubscribes from the Redis Pub/Sub channel for that user
- **AND** all associated resources are cleaned up (no memory leak)

#### Scenario: Unauthenticated SSE connection attempt
- **WHEN** a request to `GET /notifications/stream` arrives without a valid auth token
- **THEN** the system returns `401 Unauthorized`
- **AND** no SSE connection is established

### Requirement: SSE event payload format
The system SHALL use a consistent JSON payload format for all SSE notification events.

#### Scenario: Registration paid event format
- **WHEN** a `REGISTRATION_PAID` notification is delivered via SSE
- **THEN** the event payload contains `{ type: "REGISTRATION_PAID", userId, workshopId, registrationId, timestamp }`

#### Scenario: Registration failed event format
- **WHEN** a `REGISTRATION_FAILED` notification is delivered via SSE
- **THEN** the event payload contains `{ type: "REGISTRATION_FAILED", userId, workshopId, registrationId, timestamp }`

#### Scenario: Registration expired event format
- **WHEN** a `REGISTRATION_EXPIRED` notification is delivered via SSE
- **THEN** the event payload contains `{ type: "REGISTRATION_EXPIRED", userId, workshopId, registrationId, timestamp }`
