## MODIFIED Requirements

### Requirement: Request OTP
The system SHALL accept a username, look up the corresponding user, generate a random 6-digit OTP, hash it, store it in the database with an expiration time, and send the plaintext OTP to the user's registered email address only when the user is permitted to request OTP. ADMIN and STAFF users SHALL be permitted without a student roster record. STUDENT users SHALL be permitted only when an ACTIVE `StudentRecord` exists for their email.

#### Scenario: Valid admin or staff username requests OTP
- **WHEN** a client sends `POST /api/v1/auth/login` with a username belonging to an ADMIN or STAFF user
- **THEN** the system SHALL generate a random 6-digit OTP, hash it, store it in the `OtpToken` table with `expires_at` set to current time + 10 minutes, enqueue an email job via BullMQ, and return `200 OK`
- **AND** the BullMQ `email-otp` worker SHALL send a styled HTML email via Nodemailer (Gmail SMTP transport) containing the OTP code and expiration notice

#### Scenario: Valid active student username requests OTP
- **WHEN** a client sends `POST /api/v1/auth/login` with a username belonging to a STUDENT user whose email exists in `StudentRecord` with `status = "ACTIVE"`
- **THEN** the system SHALL generate a random 6-digit OTP, hash it, store it in the `OtpToken` table with `expires_at` set to current time + 10 minutes, enqueue an email job via BullMQ, and return `200 OK`
- **AND** the BullMQ `email-otp` worker SHALL send a styled HTML email via Nodemailer (Gmail SMTP transport) containing the OTP code and expiration notice

#### Scenario: Non-existent username requests OTP
- **WHEN** a client sends `POST /api/v1/auth/login` with a username that does not exist in the database
- **THEN** the system SHALL return `200 OK` with a generic message and SHALL NOT reveal whether the username or email exists

#### Scenario: Student without active imported record requests OTP
- **WHEN** a client sends `POST /api/v1/auth/login` with a username belonging to a STUDENT user whose email has no ACTIVE `StudentRecord`
- **THEN** the system SHALL return `403 Forbidden` with message `"Student record not found. Please contact admin."`
- **AND** the system SHALL NOT generate an OTP or enqueue an OTP email

#### Scenario: OTP requested while previous OTP is still valid
- **WHEN** a permitted user requests a new OTP while an unexpired OTP already exists for that user
- **THEN** the system SHALL invalidate (delete) all previous OTPs for that user and generate a fresh one
