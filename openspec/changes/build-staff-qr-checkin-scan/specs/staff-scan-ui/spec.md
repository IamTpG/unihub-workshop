## ADDED Requirements

### Requirement: Staff scan page supports selected workshop context
The system SHALL render a mobile staff QR check-in page at `/manage/scan` with selected workshop context when provided by navigation state.

#### Scenario: Scan page receives selected workshop
- **GIVEN** staff selected a workshop from `/manage`
- **WHEN** `/manage/scan` renders with navigation state `{ workshopId, workshopTitle }`
- **THEN** the page shows a top bar with a back button and the selected workshop title

#### Scenario: Scan page has no selected workshop state
- **GIVEN** staff navigates directly to `/manage/scan`
- **WHEN** the scan page renders without navigation state
- **THEN** the page still allows QR verification without `workshopId`
- **AND** the page shows a generic scan title

### Requirement: Staff can scan QR codes with camera
The scan page SHALL provide a camera mode that reads QR codes using browser camera access.

#### Scenario: Camera mode starts with rear camera preference
- **WHEN** staff opens camera scan mode
- **THEN** the page initializes the QR scanner using the rear camera when available

#### Scenario: QR code is decoded
- **WHEN** the camera scanner decodes QR text
- **THEN** the page sends `POST /api/v1/check-ins/verify` with `{ qrToken, workshopId }`

#### Scenario: Camera unavailable
- **WHEN** camera permission is denied or camera initialization fails
- **THEN** the page shows a clear camera error and keeps manual input mode available

### Requirement: Staff can manually enter QR token
The scan page SHALL provide a manual input mode for entering QR token text.

#### Scenario: Manual token submitted
- **WHEN** staff enters a QR token and taps `Check In`
- **THEN** the page sends `POST /api/v1/check-ins/verify` with `{ qrToken, workshopId }`

#### Scenario: Manual token missing
- **WHEN** staff taps `Check In` without entering a token
- **THEN** the page does not call the API and shows a validation message

### Requirement: Staff scan page displays structured check-in result
The scan page SHALL render a prominent result state for each backend check-in status.

#### Scenario: Newly checked in
- **WHEN** the backend returns `status = "CHECKED_IN"`
- **THEN** the page shows a green result with `Welcome, {studentName}!`

#### Scenario: Already checked in
- **WHEN** the backend returns `status = "ALREADY_CHECKED_IN"`
- **THEN** the page shows a yellow result with `Already checked in at {time}`

#### Scenario: Invalid QR
- **WHEN** the backend returns `status = "INVALID_QR"`
- **THEN** the page shows a red result with `QR code not recognized`

#### Scenario: Wrong workshop
- **WHEN** the backend returns `status = "WRONG_WORKSHOP"`
- **THEN** the page shows a red result with `Ticket is for a different workshop`

#### Scenario: Registration not confirmed
- **WHEN** the backend returns `status = "NOT_CONFIRMED"`
- **THEN** the page shows a red result with `Registration not confirmed (status: {status})`

### Requirement: Scan flow resets after result
The scan page SHALL automatically return to the active scan/manual state after displaying a result.

#### Scenario: Result auto-resets
- **WHEN** a check-in result is displayed
- **THEN** the page waits 3 seconds and clears the result so staff can scan or enter the next token

#### Scenario: API request in progress
- **WHEN** a check-in verification request is in flight
- **THEN** the page shows a loading state and prevents duplicate submissions for the same scan
