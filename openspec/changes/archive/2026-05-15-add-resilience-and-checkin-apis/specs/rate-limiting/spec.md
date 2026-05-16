## ADDED Requirements

### Requirement: Global rate limiting by IP
The system SHALL enforce a default rate limit of 100 requests per 60-second sliding window per client IP address across all API endpoints.

#### Scenario: Normal traffic under limit
- **WHEN** a client sends 50 requests within 60 seconds
- **THEN** all requests are processed normally with status 200

#### Scenario: Client exceeds global rate limit
- **WHEN** a client sends the 101st request within a 60-second window
- **THEN** the system returns `429 Too Many Requests` with a `Retry-After` header indicating seconds until the window resets
- **AND** the response body contains an error message explaining the rate limit

#### Scenario: Rate limit window resets
- **WHEN** a client was rate-limited and the sliding window expires
- **THEN** the client can send requests normally again

### Requirement: Stricter rate limiting on auth endpoints
The system SHALL enforce a stricter rate limit of 5 requests per 60-second window per IP on `POST /auth/request-otp` to prevent OTP spam.

#### Scenario: OTP request spam
- **WHEN** a client sends 6 OTP requests within 60 seconds
- **THEN** the 6th request returns `429 Too Many Requests`
- **AND** the first 5 requests are processed normally

### Requirement: Authenticated rate limiting on registration endpoint
The system SHALL enforce a rate limit of 10 requests per 60-second window per authenticated user on `POST /workshops/:id/register`.

#### Scenario: User spamming registration
- **WHEN** an authenticated user sends 11 registration requests within 60 seconds
- **THEN** the 11th request returns `429 Too Many Requests`
- **AND** no additional jobs are enqueued to the registration queue

### Requirement: Rate limit state persistence in Redis
The system SHALL store rate limit counters in Redis so that limits survive API restarts and are consistent across potential multiple instances.

#### Scenario: API restarts mid-window
- **WHEN** a client has sent 90 requests, and the API process restarts
- **THEN** the rate limit counter is preserved in Redis
- **AND** the client is still limited to 10 more requests in the current window

### Requirement: Role-based rate limit tiers
The system SHALL apply higher rate limits to STAFF and ADMIN roles (200 requests per 60 seconds) compared to STUDENT role (100 requests per 60 seconds).

#### Scenario: Staff user under burst load
- **WHEN** a staff user sends 150 requests within 60 seconds
- **THEN** all requests are processed normally (within the 200 req/min staff tier)

#### Scenario: Student user under same load
- **WHEN** a student user sends 150 requests within 60 seconds
- **THEN** requests 101-150 return `429 Too Many Requests`
