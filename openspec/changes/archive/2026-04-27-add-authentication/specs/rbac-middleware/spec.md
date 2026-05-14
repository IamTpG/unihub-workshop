## ADDED Requirements

### Requirement: JWT authentication middleware
The system SHALL provide an `authenticate` middleware that extracts the JWT access token from the `Authorization: Bearer <token>` header, verifies its signature using CPU-only cryptographic validation (no database query), decodes the payload, and attaches the user identity to `req.user`.

#### Scenario: Valid access token in request
- **WHEN** a request includes a valid, non-expired `Authorization: Bearer <token>` header
- **THEN** the middleware SHALL decode the token, attach `{ id: sub, role: role }` to `req.user`, and call `next()`

#### Scenario: Missing authorization header
- **WHEN** a request does not include an `Authorization` header
- **THEN** the middleware SHALL return `401 Unauthorized` with message "Authentication required"

#### Scenario: Malformed authorization header
- **WHEN** a request includes an `Authorization` header that is not in `Bearer <token>` format
- **THEN** the middleware SHALL return `401 Unauthorized` with message "Invalid token format"

#### Scenario: Expired access token
- **WHEN** a request includes an access token whose `exp` claim is in the past
- **THEN** the middleware SHALL return `401 Unauthorized` with message "Token expired"

#### Scenario: Invalid signature
- **WHEN** a request includes a token signed with a different secret
- **THEN** the middleware SHALL return `401 Unauthorized` with message "Invalid token"

#### Scenario: Zero database queries during verification
- **WHEN** the `authenticate` middleware processes any request
- **THEN** it SHALL NOT make any database or cache queries; verification is purely CPU-based (JWT signature check)

### Requirement: Role-based authorization middleware
The system SHALL provide an `authorize(...roles)` middleware factory that checks whether the authenticated user's role is in the list of allowed roles. This middleware MUST be used after `authenticate`.

#### Scenario: User has authorized role
- **WHEN** an authenticated request has `req.user.role` matching one of the roles passed to `authorize()`
- **THEN** the middleware SHALL call `next()`

#### Scenario: User has unauthorized role
- **WHEN** an authenticated request has `req.user.role` NOT matching any of the roles passed to `authorize()`
- **THEN** the middleware SHALL return `403 Forbidden` with message "Insufficient permissions"

#### Scenario: Authorize used without authenticate
- **WHEN** `authorize()` is called on a request where `req.user` is undefined (authenticate was not applied)
- **THEN** the middleware SHALL return `401 Unauthorized` with message "Authentication required"

### Requirement: Express request type extension
The system SHALL extend the Express `Request` type to include a `user` property containing the authenticated user's identity.

#### Scenario: Type definition
- **WHEN** the `authenticate` middleware populates `req.user`
- **THEN** `req.user` SHALL be typed as `{ id: string; role: "STUDENT" | "ADMIN" | "STAFF" }` in `types/express.d.ts`
