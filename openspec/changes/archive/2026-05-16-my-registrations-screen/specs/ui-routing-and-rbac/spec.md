## MODIFIED Requirements

### Requirement: Role-Based Access Control (RBAC)
The system SHALL restrict access to specific route branches based on the user's role stored in the AuthStore. Student routes now include the My Tickets feature routes.

#### Scenario: Unauthorized role access attempt
- **GIVEN** a logged-in user with the `STUDENT` role
- **WHEN** they attempt to access an Admin route (e.g., `/admin/dashboard`)
- **THEN** they are redirected to a fallback route (e.g., `/` or an Unauthorized error page)

#### Scenario: Successful login routing
- **GIVEN** a user is on the Login page
- **WHEN** they successfully authenticate and the API returns role `ADMIN`
- **THEN** they are automatically navigated to `/admin/dashboard`

#### Scenario: Student accesses My Tickets routes
- **GIVEN** a logged-in user with the `STUDENT` role
- **WHEN** they navigate to `/my-tickets`, `/my-tickets/:id/qr`, `/my-tickets/:id/pay`, `/my-tickets/:id/mock-pay`, or `/my-tickets/:id/result`
- **THEN** the page renders inside the `MobileShell` layout
- **AND** access is granted

#### Scenario: Non-student accesses My Tickets
- **GIVEN** a logged-in user with the `STAFF` role
- **WHEN** they attempt to access `/my-tickets`
- **THEN** they are redirected to the Unauthorized page
