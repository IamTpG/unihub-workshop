## 1. Backend Check-In Contract

- [x] 1.1 Developer A: Update `apps/api/src/modules/checkins/checkins.schema.ts` with `verifyCheckInSchema` accepting `{ qrToken: string, workshopId?: string }`.
- [x] 1.2 Developer A: Add or update repository lookup for registration by `qrStub`, including user and workshop fields needed for response display.
- [x] 1.3 Developer A: Implement `checkInVerify` service logic returning structured statuses `CHECKED_IN`, `ALREADY_CHECKED_IN`, `INVALID_QR`, `WRONG_WORKSHOP`, and `NOT_CONFIRMED`.
- [x] 1.4 Developer A: Ensure successful check-in updates `checkedInAt` atomically only when `checkedInAt` is null and status is `PAID`.
- [x] 1.5 Developer A: Preserve existing batch sync endpoint behavior.
- [x] 1.6 Developer A: Update check-in routes to expose `POST /api/v1/check-ins/verify` for STAFF and ADMIN roles.
- [x] 1.7 Developer A: Update controller response shape to match the structured check-in result contract.

## 2. Web Dependency and API Client Usage

- [x] 2.1 Developer B: Install `html5-qrcode` in the `@unihub/web` workspace if it is not already present.
- [x] 2.2 Developer B: Define frontend types for check-in verify request and response in or near the staff scan page.
- [x] 2.3 Developer B: Use the existing Axios API client to post to `/check-ins/verify` with `{ qrToken, workshopId }`.

## 3. Staff Scan Page

- [x] 3.1 Developer B: Create `apps/web/src/pages/staff/Scan.tsx`.
- [x] 3.2 Developer B: Render a mobile top bar with a back button and selected workshop title from route state.
- [x] 3.3 Developer B: Implement camera/manual segmented mode toggle with large tap targets.
- [x] 3.4 Developer B: Implement camera scanning with `html5-qrcode`, preferring the rear camera.
- [x] 3.5 Developer B: Implement manual token input and `Check In` submit button.
- [x] 3.6 Developer B: Prevent duplicate submissions while loading or while a result is visible.
- [x] 3.7 Developer B: Render loading state while the verify API request is in progress.
- [x] 3.8 Developer B: Render prominent green/yellow/red result cards for all backend statuses with required messages.
- [x] 3.9 Developer B: Auto-reset the result after 3 seconds and resume scan/manual readiness.
- [x] 3.10 Developer B: Show camera initialization errors without blocking manual mode.

## 4. Staff Desk and Routing

- [x] 4.1 Developer B: Update `apps/web/src/pages/staff/Desk.tsx` workshop card click handler to navigate with `{ workshopId: ws.id, workshopTitle: ws.title }` state.
- [x] 4.2 Developer B: Import the new `Scan` page in `apps/web/src/router/index.tsx`.
- [x] 4.3 Developer B: Replace the `/manage/scan` placeholder with `<Scan />`.
- [x] 4.4 Developer B: Confirm `/manage/scan` remains inside `ProtectedRoute allowedRoles={['STAFF']}` and `MobileShell`.

## 5. Verification

- [x] 5.1 Developer A: Add or update backend checks/tests for checked-in, already-checked-in, invalid QR, wrong workshop, and not-confirmed outcomes.
- [x] 5.2 Developer B: Add or update frontend checks/manual verification notes for camera scan, manual entry, loading, result colors, auto-reset, and missing route state.
- [x] 5.3 Developer A: Run API build/typecheck.
- [x] 5.4 Developer B: Run web build/typecheck.
