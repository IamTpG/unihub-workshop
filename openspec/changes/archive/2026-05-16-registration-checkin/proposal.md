## Why

To enable a reliable and secure check-in process for workshop staff, ensuring that only students with confirmed (PAID) registrations can participate. By standardizing the QR code content to the registration ID, we simplify the bridge between the student's mobile ticket and the staff's scanning/verification system.

## What Changes

- **Backend**: Update `PaymentWebhookController` to populate the `qrStub` field strictly with the `registrationId` upon successful payment (transition to `PAID`).
- **Backend**: Align the `checkin-api` (already partially implemented) to use the `registrationId` scanned from the QR code for verification and status updates.
- **Backend**: Ensure the check-in process remains idempotent and strictly validates that `checkedInAt` is only set once for `PAID` registrations.

## Capabilities

### New Capabilities
- `registration-checkin`: Implementation of the staff-facing check-in verification flow and API integration.

### Modified Capabilities
- `registration-lifecycle`: Modified to automate `qrStub` generation (as `registrationId`) when `RegStatus` transitions to `PAID`.

## Impact

- **API**: `POST /payments/webhook/:provider` (updated logic).
- **API**: `POST /registrations/check-in` (verified/updated integration).
- **Database**: `Registration` model (`qrStub` field usage).
- **Frontend**: Student `TicketQR` screen (will now encode the raw `registrationId`).
