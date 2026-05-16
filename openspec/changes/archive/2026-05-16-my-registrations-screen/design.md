## Context

The UniHub Workshop application has a complete registration backend (queue-based registration, payment webhook, slot management) but the student-facing frontend has no screen to view or manage existing registrations. The `/my-registrations` route currently renders a placeholder `<div>`. The backend stores registrations with statuses `PENDING → HOLDING → PAID/FAILED/EXPIRED`, and paid tickets have a `qrStub` string for check-in. A `MockPaymentProvider` already exists that skips signature verification and parses webhook payloads directly.

### Current State
- **Backend**: `POST /workshops/:id/register` enqueues a BullMQ job → worker creates registration (PENDING) → atomic slot decrement → sets HOLDING with `paymentRef` for paid workshops, or PAID directly for free ones.
- **Payment Webhook**: `POST /registrations/webhook/:provider` accepts `{ eventType, intentId, eventId }`, looks up by `paymentRef`, and transitions HOLDING → PAID (with `qrStub`) or FAILED/EXPIRED.
- **Frontend**: No `GET` endpoint to fetch registrations. No UI to display them.

## Goals / Non-Goals

**Goals:**
- Provide students a "My Registrations" screen with instant tab switching between confirmed (Successful) and non-confirmed (Pending) tickets.
- Allow students to view a QR code for confirmed tickets (generated from `qrStub`).
- Provide a mock payment flow that exercises the existing `payment-webhook.controller.ts` end-to-end.
- Add a `GET /registrations` backend endpoint with `?status=` query filtering.

**Non-Goals:**
- Real payment gateway integration (Stripe, MoMo, VNPay).
- Job status polling after `POST /workshops/:id/register` (the `jobId` → registration lookup).
- Push/SSE notifications on payment status changes.
- Registration cancellation or refund flows.
- Pagination of registration lists.

## Decisions

### 1. Single API endpoint with query parameter filtering

**Decision**: Use `GET /registrations?status=PAID` and `GET /registrations?status=PENDING,HOLDING,FAILED,EXPIRED` rather than two separate endpoints or a single fetch-all.

**Alternatives considered**:
- *Fetch-all and filter on frontend*: Simple but doesn't scale — downloads unnecessary data on mobile.
- *Two separate endpoints* (`/registrations/paid`, `/registrations/pending`): Duplicates backend logic.

**Rationale**: One route handler, one repository method, clean separation. The status filter maps directly to a Prisma `where` clause. Pagination can be added later with `?page=` without breaking the contract.

### 2. Client-side QR code generation from `qrStub` string

**Decision**: Use a frontend QR code library (e.g., `qrcode.react`) to generate the QR image from the `qrStub` string stored on the registration.

**Alternatives considered**:
- *Backend generates QR image and returns URL*: Adds backend complexity, storage cost, and latency.

**Rationale**: The `qrStub` string already exists in the DB (set by `payment-webhook.controller.ts` on `PAYMENT_SUCCEEDED`). Generating the QR on the client is instant, works offline, and avoids adding image storage infrastructure.

### 3. Mock payment as an in-app screen (not external redirect)

**Decision**: The "Pay" button navigates to an in-app mock payment screen with "Simulate Success" and "Simulate Failure" buttons. These buttons directly POST to `POST /registrations/webhook/mock` from the frontend.

**Alternatives considered**:
- *Open a separate browser tab*: Mimics real payment flow but is harder to develop and test.
- *Use deep-link redirect simulation*: Overengineered for a mock.

**Rationale**: The `MockPaymentProvider.verifyWebhook()` skips signature verification and just parses the JSON body directly. This means the frontend can call the webhook endpoint directly with `{ eventType, intentId, eventId }`. After the webhook call, the frontend polls `GET /registrations?status=PAID` (or fetches the single registration) to confirm the status change, then shows the result screen.

### 4. Payment result via polling the registration status

**Decision**: After triggering the mock webhook, poll `GET /registrations/:id` every 1s (max 5 attempts) to check if status changed from HOLDING to PAID or FAILED.

**Sequence for mock payment flow:**
```
1. User taps HOLDING ticket → navigate to PaymentDetails screen
2. User taps "Pay $45.00" → navigate to MockGateway screen
3. User taps "Simulate Success" →
   a. Frontend POSTs to /registrations/webhook/mock with { eventType: "PAYMENT_SUCCEEDED", intentId: <paymentRef>, eventId: "mock_<timestamp>" }
   b. Backend processes webhook → updates status to PAID, generates qrStub
   c. Frontend polls GET /registrations/<id> until status === "PAID"
4. Navigate to PaymentResult screen (success)
5. User taps "Back to My Tickets" → navigate to /my-registrations (Successful tab)
```

**Failure sequence:**
```
1-2. Same as above
3. User taps "Simulate Failure" →
   a. Frontend POSTs with eventType: "PAYMENT_FAILED"
   b. Backend updates status to FAILED, releases slot
   c. Frontend polls until status === "FAILED"
4. Navigate to PaymentResult screen (failure)
5. User taps "Back to My Tickets" → navigate to /my-registrations (Pending tab)
```

### 5. Frontend component structure

```
pages/student/
├── MyTickets.tsx           # Tab container (Successful | Pending)
├── TicketQR.tsx            # QR code display for a PAID ticket
├── PaymentDetails.tsx      # Shows workshop info, amount, "Pay" button
├── MockPaymentGateway.tsx  # Simulate Success / Simulate Failure buttons
└── PaymentResult.tsx       # Success or failure result screen
```

Routes:
```
/my-registrations                 → MyTickets (tab view)
/my-registrations/:id/qr          → TicketQR
/my-registrations/:id/pay         → PaymentDetails
/my-registrations/:id/mock-pay    → MockPaymentGateway
/my-registrations/:id/result      → PaymentResult
```

### Failure Isolation and Fallback Behavior

- **Webhook call fails (network error)**: The MockGateway screen shows an inline error "Payment service unreachable. Please try again." with a retry button. The registration remains in HOLDING status.
- **Polling timeout (5 attempts, no status change)**: The PaymentResult screen shows "Payment is being processed. Check back in My Tickets." and navigates back. The ticket will still appear in the Pending tab.
- **GET /registrations fails**: The MyTickets screen shows a "Failed to load registrations" error with a retry button. An empty state is shown per tab.
- **QR generation fails**: Fallback to displaying the raw `qrStub` string as text.

## Risks / Trade-offs

- **[Risk] Frontend calls webhook directly** → In production, webhooks are server-to-server only. This is acceptable because we only use the `mock` provider which skips signature verification. When a real provider is integrated, the frontend will redirect to the provider's checkout page instead. → *Mitigation*: The mock gateway screen is visually distinct and clearly labeled as a simulation.
- **[Risk] No real-time status update** → After triggering the webhook, we poll instead of using SSE. There's a brief delay before the UI reflects the change. → *Mitigation*: Show a loading spinner during polling. The delay is typically <2 seconds with a local backend.
- **[Risk] `paymentRef` could be null on HOLDING tickets** → If the payment breaker circuit opened during registration, `paymentRef` is null even though status is HOLDING. → *Mitigation*: The PaymentDetails screen checks for `paymentRef`. If null, show "Payment service temporarily unavailable. Please try again later." instead of the Pay button.
