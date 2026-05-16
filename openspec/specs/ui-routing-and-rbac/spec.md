# ui-routing-and-rbac Specification

## Purpose
TBD - created by archiving change add-web-app-shell-and-routing. Update Purpose after archive.
## Requirements
### Requirement: Authentication Guard
The system SHALL intercept navigation to protected routes and redirect unauthenticated users to the public Login page.

#### Scenario: Unauthenticated access attempt
- **GIVEN** a user is not logged in (no valid token in AuthStore)
- **WHEN** they attempt to access a protected route (e.g., `/admin/dashboard`)
- **THEN** they are redirected to `/login`
- **AND** the system retains the intended destination (optional, for post-login redirect)

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

### Requirement: Role-Specific Layout Shells
The system SHALL wrap protected pages in layout shells optimized for the target role's primary device context.

#### Scenario: Admin layout presentation
- **GIVEN** an `ADMIN` user navigates to an admin route
- **WHEN** the page renders
- **THEN** it mounts inside the `AdminShell` (Desktop-first: Sidebar and Top Header)

#### Scenario: Student/Staff layout presentation
- **GIVEN** a `STUDENT` or `STAFF` user navigates to their respective routes
- **WHEN** the page renders
- **THEN** it mounts inside the `MobileShell` (Mobile-first: Bottom Navigation Bar and Header)

### Requirement: OTP Verification Flow
The system SHALL require a 2-step flow for identity verification, communicating with active API endpoints to trigger and verify OTPs before issuing session access.

#### Scenario: Successful OTP dispatch
- **GIVEN** the user is on the first step of the Login page
- **WHEN** they enter a valid username and submit
- **THEN** the system SHALL dispatch a `POST /api/v1/auth/login` request
- **AND** transition the UI to state "OTP Input" upon receipt of success status

#### Scenario: Live token decoding and persistence
- **GIVEN** the UI is in "OTP Input" state
- **WHEN** the user enters the 6-digit code and submits
- **THEN** the system SHALL dispatch a `POST /api/v1/auth/verify-otp` request
- **AND** upon 200 OK, save the returned `accessToken` in the AuthStore
- **AND** decode the payload using `jwt-decode` to automatically populate the user's active role.

