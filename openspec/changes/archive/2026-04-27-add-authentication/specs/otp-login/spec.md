## ADDED Requirements

### Requirement: Request OTP
The system SHALL accept a username, look up the corresponding user, generate a random 6-digit OTP, hash it, store it in the database with an expiration time, and send the plaintext OTP to the user's registered email address.

#### Scenario: Valid username requests OTP
- **WHEN** a client sends `POST /api/v1/auth/login` with `{ "username": "22120001" }`
- **THEN** the system SHALL generate a random 6-digit OTP, hash it, store it in the `OtpToken` table with `expires_at` set to current time + 10 minutes, enqueue an email job via BullMQ, and return `200 OK`
- **AND** the BullMQ `email-otp` worker SHALL send a styled HTML email via Nodemailer (Gmail SMTP transport) containing the OTP code and expiration notice

#### Scenario: Non-existent username requests OTP
- **WHEN** a client sends `POST /api/v1/auth/login` with a username that does not exist in the database
- **THEN** the system SHALL return `200 OK` with a generic message (anti-enumeration)

#### Scenario: OTP requested while previous OTP is still valid
- **WHEN** a client requests a new OTP while an unexpired OTP already exists for that user
- **THEN** the system SHALL invalidate (delete) all previous OTPs for that user and generate a fresh one

### Requirement: Verify OTP
The system SHALL accept a username and OTP, validate the OTP against the stored hash, and upon success issue a JWT access token and a refresh token. Failed attempts SHALL be tracked to prevent brute-force attacks.

#### Scenario: Correct OTP submitted
- **WHEN** a client sends `POST /api/v1/auth/verify-otp` with `{ "username": "22120001", "otp": "482916" }` and the OTP matches the stored hash and has not expired
- **THEN** the system SHALL mark `is_used = true`, generate a JWT access token (containing `sub`, `role`, `iat`, `exp`), generate a refresh token, store the refresh token hash in the `RefreshToken` table with a `family_id`, set an `httpOnly` cookie named `refreshToken`, and return `200 OK` with `{ "accessToken": "..." }`

#### Scenario: Incorrect OTP submitted
- **WHEN** a client sends a verify request with an OTP that does not match the stored hash
- **THEN** the system SHALL increment the attempt counter for that OTP record and return `401 Unauthorized` with message "Invalid or expired OTP"

#### Scenario: OTP brute-force protection
- **WHEN** a client makes more than 5 verify attempts for a single username within 10 minutes
- **THEN** the system SHALL return `429 Too Many Requests`

#### Scenario: OTP max attempts exceeded
- **WHEN** a client submits an incorrect OTP and the attempt count reaches the maximum (default 3)
- **THEN** the system SHALL delete the OTP record (forcing the user to request a new one) and return `401 Unauthorized` with message "OTP attempts exceeded. Please request a new OTP."

#### Scenario: Expired OTP submitted
- **WHEN** a client sends a verify request with an OTP whose `expiresAt` timestamp is in the past
- **THEN** the system SHALL return `401 Unauthorized` with message "Invalid or expired OTP"
