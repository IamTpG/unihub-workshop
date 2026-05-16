## ADDED Requirements

### Requirement: Payment Details screen
The system SHALL display a Payment Details screen for HOLDING registrations showing the workshop title, registration date, amount due, a "Waiting for Payment" warning banner, payment method display, price breakdown, and a "Pay" action button.

#### Scenario: Display payment details for a HOLDING ticket
- **GIVEN** the student has a HOLDING registration for "Data Visualization with D3.js" with price $45.00
- **WHEN** the student navigates to `/my-registrations/:id/pay`
- **THEN** the screen shows workshop title "Data Visualization with D3.js"
- **AND** the registration date
- **AND** amount due "$45.00"
- **AND** a yellow/amber warning banner "Waiting for Payment — Your registration is on hold. Complete payment to confirm your spot."
- **AND** a "Pay $45.00" button at the bottom

#### Scenario: Payment details with null paymentRef
- **GIVEN** the registration has status HOLDING but `paymentRef` is null
- **WHEN** the student navigates to `/my-registrations/:id/pay`
- **THEN** a message "Payment service temporarily unavailable. Please try again later." is displayed
- **AND** the "Pay" button is disabled

### Requirement: Mock payment gateway screen
The system SHALL display a mock payment gateway screen with "Simulate Payment Success" and "Simulate Payment Failure" buttons. This screen SHALL be visually distinct from the rest of the app to clearly indicate it is a simulation.

#### Scenario: Navigate to mock gateway
- **GIVEN** the student is on the Payment Details screen for a HOLDING registration with `paymentRef` "mock_intent_mock_1_1715900000000"
- **WHEN** the student taps "Pay $45.00"
- **THEN** the app navigates to `/my-registrations/:id/mock-pay`
- **AND** shows a mock gateway screen with "Simulate Payment Success" and "Simulate Payment Failure" buttons

#### Scenario: Simulate successful payment
- **WHEN** the student taps "Simulate Payment Success"
- **THEN** the frontend POSTs to `POST /registrations/webhook/mock` with body `{ eventType: "PAYMENT_SUCCEEDED", intentId: "<paymentRef>", eventId: "mock_<timestamp>" }`
- **AND** a loading spinner is shown while the webhook processes
- **AND** the frontend polls `GET /registrations/:id` until the status changes to PAID
- **AND** the app navigates to the Payment Result screen showing success

#### Scenario: Simulate failed payment
- **WHEN** the student taps "Simulate Payment Failure"
- **THEN** the frontend POSTs to `POST /registrations/webhook/mock` with body `{ eventType: "PAYMENT_FAILED", intentId: "<paymentRef>", eventId: "mock_<timestamp>" }`
- **AND** the frontend polls `GET /registrations/:id` until the status changes to FAILED
- **AND** the app navigates to the Payment Result screen showing failure

#### Scenario: Webhook call fails due to network error
- **WHEN** the student taps "Simulate Payment Success" but the POST to the webhook endpoint fails
- **THEN** an inline error "Payment service unreachable. Please try again." is displayed
- **AND** the buttons remain available for retry
- **AND** the registration stays in HOLDING status

### Requirement: Payment result screen
The system SHALL display a result screen after payment processing indicating success or failure, with navigation back to the My Tickets screen.

#### Scenario: Successful payment result
- **GIVEN** the payment webhook returned PAYMENT_SUCCEEDED and the registration status is now PAID
- **WHEN** the Payment Result screen is displayed
- **THEN** a success icon and "Payment Successful!" message are shown
- **AND** a "View My Ticket" button navigates to `/my-registrations` with the Successful tab active

#### Scenario: Failed payment result
- **GIVEN** the payment webhook returned PAYMENT_FAILED and the registration status is now FAILED
- **WHEN** the Payment Result screen is displayed
- **THEN** an error icon and "Payment Failed" message are shown
- **AND** a "Back to My Tickets" button navigates to `/my-registrations`

#### Scenario: Polling timeout without status change
- **GIVEN** the webhook was called but the status has not changed after 5 polling attempts (5 seconds)
- **WHEN** the polling times out
- **THEN** the Payment Result screen shows "Payment is being processed. Check back in My Tickets."
- **AND** a "Back to My Tickets" button is available
