## ADDED Requirements

### Requirement: Dedicated RBAC middleware module
The system SHALL provide a dedicated RBAC middleware module at `apps/api/src/middleware/rbac.middleware.ts`.

#### Scenario: RBAC middleware file exists
- **GIVEN** the API source tree is available
- **WHEN** a developer opens `apps/api/src/middleware/rbac.middleware.ts`
- **THEN** the file SHALL export a `requireRoles` middleware factory

#### Scenario: Middleware accepts Role array
- **GIVEN** the RBAC middleware module is imported
- **WHEN** a developer calls `requireRoles(["ADMIN", "STAFF"])`
- **THEN** TypeScript SHALL accept the argument as an array of `Role` enum values

## MODIFIED Requirements

### Requirement: Role-based authorization middleware
The system SHALL provide a `requireRoles(allowedRoles)` middleware factory that checks whether the authenticated user's role is in the array of allowed roles. This middleware MUST be used after `authenticate`.

#### Scenario: User has authorized role
- **GIVEN** `authenticate` has populated `req.user`
- **WHEN** an authenticated request has `req.user.role` matching one of the roles passed to `requireRoles(allowedRoles)`
- **THEN** the middleware SHALL call `next()`

#### Scenario: User has unauthorized role
- **GIVEN** `authenticate` has populated `req.user`
- **WHEN** an authenticated request has `req.user.role` NOT matching any of the roles passed to `requireRoles(allowedRoles)`
- **THEN** the middleware SHALL return `403 Forbidden` with message "Insufficient permissions"

#### Scenario: RBAC used without authenticate
- **GIVEN** `authenticate` has not populated `req.user`
- **WHEN** `requireRoles(allowedRoles)` is called on the request
- **THEN** the middleware SHALL return `401 Unauthorized` with message "Authentication required"

#### Scenario: Empty allowed roles array
- **GIVEN** `authenticate` has populated `req.user`
- **WHEN** `requireRoles([])` is called on the request
- **THEN** the middleware SHALL return `403 Forbidden` with message "Insufficient permissions"

#### Scenario: No external dependency calls
- **GIVEN** `requireRoles(allowedRoles)` processes any request
- **WHEN** it checks authorization
- **THEN** it SHALL NOT make database, cache, queue, mail, or network calls
