## Why

Students currently have no way to view their workshop registrations after signing up. The `/my-registrations` route exists but renders a placeholder. This change implements the full "My Registrations" screen with two tabs (Successful / Pending), a QR code viewer for confirmed tickets, and a mock payment flow that integrates with the existing `payment-webhook.controller.ts`. This slice is critical for the course demo because it closes the registration lifecycle loop — from discovering a workshop, to registering, to paying, to presenting a ticket at check-in.

## What Changes

- **New "My Registrations" page** with two tabs:
  - **Successful** — lists registrations with status `PAID`. Tapping a ticket opens a QR code screen generated from the `qrStub` field.
  - **Pending** — lists all registrations with statuses other than `PAID` (e.g., `HOLDING`, `PENDING`, `FAILED`, `EXPIRED`). Tapping a `HOLDING` ticket opens a Payment Details screen.
- **New backend endpoint** `GET /registrations?status=PAID` or `GET /registrations?status=HOLDING,PENDING,FAILED,EXPIRED` — returns the authenticated user's registrations filtered by status group.
- **Mock payment simulation screen** — when the user taps "Pay" on a HOLDING ticket, a mock payment gateway screen appears with "Simulate Success" and "Simulate Failure" buttons. These trigger a `POST /registrations/webhook/mock` call to the existing backend webhook, which updates the ticket status.
- **Payment result screen** — after the webhook processes, the app shows a success or failure result screen with navigation back to the registrations list.
- **New routes** added to the React Router for `/my-registrations`, `/my-registrations/:id/qr`, `/my-registrations/:id/pay`, and `/my-registrations/:id/result`.
- Mock data seeded for development until the real API endpoint is built, using the same data shape as the API response.

### Non-Goals
- Real third-party payment gateway integration (Stripe, MoMo) — only the mock provider is used.
- Push notifications for payment status changes — the existing SSE notification system is out of scope for this screen.
- Registration cancellation or refund flows.
- Job status polling for the `jobId` returned by `POST /workshops/:id/register` — this is a future enhancement. For now, HOLDING tickets are accessed via the Pending tab.

## Capabilities

### New Capabilities
- `registration-list-ui`: The "My Registrations" screen with tabbed layout (Successful / Pending), ticket cards, and navigation to detail screens.
- `registration-qr-viewer`: QR code display screen that generates a scannable QR image from the `qrStub` string stored on a PAID registration.
- `mock-payment-flow`: End-to-end mock payment flow — Payment Details screen → Mock Gateway simulation → Webhook trigger → Result screen.
- `registration-list-api`: Backend `GET /registrations` endpoint returning the authenticated user's registrations filtered by status query parameter.

### Modified Capabilities
- `ui-routing-and-rbac`: New student routes added under `/my-registrations` for ticket detail, QR, and payment screens.

## Impact

- **Frontend (`apps/web`)**: New page components under `pages/student/`, new routes in `router/index.tsx`, new API call functions in `lib/api.ts`.
- **Backend (`apps/api`)**: New `GET` route and controller method in `modules/registrations/`, new repository query method.
- **Shared (`packages/shared`)**: No changes expected — `RegStatus`, `PaymentProvider`, and `WebhookEvent` types already exist.
- **Database (`packages/db`)**: No schema changes — `Registration` model already has `status`, `paymentRef`, `qrStub`, and related workshop fields.
- **Worker (`apps/worker`)**: No changes — existing `registration.processor.ts` already sets `paymentRef` and handles status transitions.
