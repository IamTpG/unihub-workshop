## ADDED Requirements

### Requirement: Access token issuance
The system SHALL issue a signed JWT access token upon successful OTP verification. The token SHALL contain minimal claims (`sub`, `role`, `iat`, `exp`) and SHALL be signed with a secret configured via environment variable.

#### Scenario: Access token structure
- **WHEN** the system issues an access token
- **THEN** the token payload SHALL contain `sub` (user UUID), `role` (one of STUDENT, ADMIN, STAFF), `iat` (issued at), and `exp` (expiration at current time + JWT_ACCESS_TTL, default 15 minutes)

#### Scenario: Access token signing
- **WHEN** the system signs an access token
- **THEN** the token SHALL be signed using the HS256 algorithm with the `JWT_ACCESS_SECRET` environment variable

### Requirement: Refresh token issuance and storage
The system SHALL issue an opaque refresh token alongside the access token. The refresh token SHALL be hashed before storage and associated with a token family for theft detection.

#### Scenario: Refresh token creation
- **WHEN** the system issues a refresh token (on initial login)
- **THEN** the system SHALL generate a cryptographically random token, hash it with SHA-256, store it in the `RefreshToken` table with a new `family_id`, `user_id`, `expires_at` (current time + 7 days), and `is_revoked` set to false

### Requirement: Token refresh with rotation
The system SHALL accept a refresh token, validate it, issue a new access + refresh token pair, and revoke the old refresh token. This implements single-use rotation.

#### Scenario: Valid refresh token submitted
- **WHEN** a client sends `POST /api/v1/auth/refresh` with `{ "refreshToken": "..." }` and the token matches a non-revoked, non-expired record
- **THEN** the system SHALL mark the old refresh token as revoked, generate a new refresh token in the same `family_id`, issue a new access token, and return `200 OK` with `{ "accessToken": "...", "refreshToken": "..." }`

#### Scenario: Expired refresh token submitted
- **WHEN** a client sends a refresh request with a token whose `expiresAt` is in the past
- **THEN** the system SHALL return `401 Unauthorized` with message "Refresh token expired. Please log in again."

#### Scenario: Revoked refresh token reused (theft detection)
- **WHEN** a client sends a refresh request with a token that is already marked as `isRevoked = true`
- **THEN** the system SHALL revoke ALL refresh tokens in that `familyId` (family-wide revocation) and return `401 Unauthorized` with message "Security alert: session revoked. Please log in again."

### Requirement: Logout
The system SHALL allow an authenticated user to explicitly revoke their refresh token family, invalidating all active sessions for that family.

#### Scenario: Successful logout
- **WHEN** an authenticated client sends `POST /api/v1/auth/logout` with `{ "refreshToken": "..." }`
- **THEN** the system SHALL revoke all refresh tokens in the matching `familyId` and return `200 OK` with message "Logged out successfully"

#### Scenario: Logout with invalid refresh token
- **WHEN** a client sends a logout request with a refresh token that does not match any record
- **THEN** the system SHALL return `200 OK` with message "Logged out successfully" (no error, to prevent information leakage)
