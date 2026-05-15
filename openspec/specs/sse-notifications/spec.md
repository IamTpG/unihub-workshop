## ADDED Requirements

### Requirement: Notification worker processor
The system SHALL consume notification jobs from a queue and publish notification events to Redis Pub/Sub channels scoped per user.

#### Scenario: Notification job processed successfully
- **WHEN** a notification job is processed
- **THEN** the processor publishes a JSON event to the user's Redis channel

### Requirement: SSE endpoint for real-time notifications
The system SHALL provide a Server-Sent Events (SSE) endpoint that streams notification events to authenticated clients.

#### Scenario: Client connects to SSE stream
- **WHEN** an authenticated user connects to the SSE endpoint
- **THEN** the server subscribes to the user's Redis Pub/Sub channel and keeps the connection alive

#### Scenario: SSE keepalive
- **WHEN** a client is connected and no events occur for a set period (e.g., 30 seconds)
- **THEN** the server sends a keepalive comment to prevent connection timeout

#### Scenario: Client disconnects
- **WHEN** an SSE client closes the connection
- **THEN** the server unsubscribes from the Redis Pub/Sub channel and cleans up resources
