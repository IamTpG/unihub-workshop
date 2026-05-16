## ADDED Requirements

### Requirement: Registration list with tabbed layout
The system SHALL display a "My Registrations" screen with two tabs: "Successful" and "Pending". The "Successful" tab SHALL be selected by default. Each tab SHALL show a count badge with the number of registrations in that category.

#### Scenario: Student opens My Registrations with mixed tickets
- **GIVEN** the student has 4 PAID registrations and 1 HOLDING registration
- **WHEN** the student navigates to `/my-registrations`
- **THEN** the "Successful" tab is active with badge showing "4"
- **AND** the "Pending" tab shows badge "1"
- **AND** 4 ticket cards are displayed with "Confirmed" status badges

#### Scenario: Student switches to Pending tab
- **GIVEN** the student is on the "Successful" tab
- **WHEN** the student taps the "Pending" tab
- **THEN** the API is called with `GET /registrations?status=HOLDING,PENDING,FAILED,EXPIRED` (or similar group filter)
- **AND** non-PAID tickets are displayed with their respective status badges

#### Scenario: Student has no registrations
- **GIVEN** the student has no registrations of any status
- **WHEN** the student navigates to `/my-registrations`
- **THEN** an empty state message is shown: "No registrations yet"
- **AND** both tab badges show "0"

### Requirement: Ticket card displays workshop info
Each ticket card SHALL display the workshop title (truncated with ellipsis if long), the workshop date, a status badge (green "Confirmed" for PAID, amber "Awaiting Payment" for HOLDING), and the price for HOLDING tickets.

#### Scenario: PAID ticket card display
- **WHEN** a PAID registration is rendered
- **THEN** the card shows the workshop title, date formatted as "M/DD/YYYY", and a green "✓ Confirmed" badge

#### Scenario: HOLDING ticket card display
- **WHEN** a HOLDING registration is rendered
- **THEN** the card shows the workshop title, "Payment pending" subtitle, an amber "⚠ Awaiting Payment" badge, and the price (e.g., "$45.00")

### Requirement: Ticket card navigation
Tapping a ticket card SHALL navigate to the appropriate detail screen based on registration status.

#### Scenario: Tap a PAID ticket
- **WHEN** the student taps a PAID ticket card
- **THEN** the app navigates to `/my-registrations/:id/qr` showing the QR code

#### Scenario: Tap a HOLDING ticket
- **WHEN** the student taps a HOLDING ticket card
- **THEN** the app navigates to `/my-registrations/:id/pay` showing the Payment Details screen

### Requirement: Loading and error states
The registration list SHALL show a loading spinner while fetching data and an error message with retry button if the API call fails.

#### Scenario: API call in progress
- **WHEN** the registration list is loading
- **THEN** a loading spinner is displayed

#### Scenario: API call fails
- **WHEN** the API call to `GET /registrations` returns an error
- **THEN** an error message "Failed to load registrations" is shown
- **AND** a "Retry" button is available
- **WHEN** the student taps "Retry"
- **THEN** the API call is retried
