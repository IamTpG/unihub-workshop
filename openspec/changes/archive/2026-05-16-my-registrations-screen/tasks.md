## 1. Backend — Registration List API (Developer A, Evening 1)

- [x] 1.1 Add `findByUser(userId: string, statuses?: RegStatus[])` method to `registrations.repository.ts` — query registrations filtered by userId with optional array of statuses, including nested workshop data (title, startTime, price)
- [x] 1.2 Add `findOneByUser(id: string, userId: string)` method to `registrations.repository.ts` — query a single registration owned by the user with nested workshop data
- [x] 1.3 Add `listRegistrations` and `getRegistration` methods to `registrations.controller.ts` — parse `status` query param (supporting comma-separated values), call repository, return JSON response
- [x] 1.4 Add `GET /registrations` and `GET /registrations/:id` routes to `registrations.routes.ts` — with `authenticate` middleware and `requireRoles([Role.STUDENT])` guard
- [x] 1.5 Test the API endpoints manually with curl or the web app — verify filtering by PAID and Pending status groups returns correct responses

## 2. Frontend — My Tickets Screen (Developer B, Evening 1)

- [x] 2.1 Install `qrcode.react` package in `apps/web`
- [x] 2.2 Create `pages/student/MyRegistrations.tsx` — tabbed layout with "Successful" and "Pending" tabs, each showing a count badge, ticket card list, loading spinner, error state with retry, and empty state
- [x] 2.3 Create ticket card component within `MyRegistrations.tsx` — displays workshop title (truncated), date, status badge (green "Confirmed" / respective color for others), and price for HOLDING tickets
- [x] 2.4 Add API functions to `lib/api.ts` — `getRegistrations(status?: string)` calling `GET /registrations?status=`, and `getRegistration(id: string)` calling `GET /registrations/:id`
- [x] 2.5 Wire up tab switching to call the API with the correct status filter and display results

## 3. Frontend — QR Code & Payment Screens (Developer B, Evening 2)

- [x] 3.1 Create `pages/student/TicketQR.tsx` — fetch registration by ID, render QR code from `qrStub` using `qrcode.react`, show workshop title and date, fallback text if `qrStub` is null, back button to `/my-tickets`
- [x] 3.2 Create `pages/student/PaymentDetails.tsx` — fetch registration by ID, display workshop info, amount due, "Waiting for Payment" warning banner, price breakdown, "Pay" button (disabled if `paymentRef` is null), navigate to mock gateway on click
- [x] 3.3 Create `pages/student/MockPaymentGateway.tsx` — visually distinct screen with "Simulate Payment Success" and "Simulate Payment Failure" buttons, POST to `/registrations/webhook/mock` with correct body `{ eventType, intentId: paymentRef, eventId: "mock_" + Date.now() }`, show loading spinner, handle network errors with retry
- [x] 3.4 Create `pages/student/PaymentResult.tsx` — display success (green checkmark, "Payment Successful!") or failure (red X, "Payment Failed") based on route state, navigation buttons back to `/my-tickets`

## 4. Frontend — Routing & Integration (Developer A, Evening 2)

- [x] 4.1 Update `router/index.tsx` — replace placeholder `/my-tickets` with actual `MyRegistrations` component, add child routes for `:id/qr`, `:id/pay`, `:id/mock-pay`, `:id/result` under the `/my-registrations` path with `ProtectedRoute` and `MobileShell` wrapping
- [x] 4.2 Add polling utility function — after webhook POST, poll `GET /registrations/:id` every 1s for max 5 attempts until status changes from HOLDING, then navigate to result screen with success/failure state
- [x] 4.3 Add mock seed data for development — create a few mock registrations with PAID (including qrStub) and HOLDING (including paymentRef) statuses in the seed file for testing without running the full registration flow

## 5. Polish & End-to-End Testing (Both Developers, Evening 3)

- [x] 5.1 Style all screens to match the dark theme mockups — ticket cards with dark background, green confirmed badges, amber pending badges, proper spacing, responsive layout within MobileShell
- [x] 5.2 End-to-end flow test: navigate to My Tickets → tap a HOLDING ticket → Payment Details → Pay → Mock Gateway → Simulate Success → verify result screen → return to My Tickets → verify ticket now in Successful tab
- [x] 5.3 End-to-end failure test: same flow but tap "Simulate Failure" → verify failure result screen → verify ticket removed from Pending tab
- [x] 5.4 Test QR code flow: tap a PAID ticket → verify QR renders → verify QR encodes the correct `qrStub` string
- [x] 5.5 Test edge cases: null paymentRef (disabled Pay button), null qrStub (fallback text), API errors (retry button), empty tabs (empty state message), various pending statuses (HOLDING, FAILED, EXPIRED)
