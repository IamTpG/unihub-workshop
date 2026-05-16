## Why

Staff check-in is currently blocked by a placeholder scan route and a backend endpoint that only accepts registration IDs directly. This change makes QR-based mobile check-in usable for demos and satisfies the core requirement that check-in staff can scan or manually enter a ticket and receive clear outcomes.

## What Changes

- Replace the `/manage/scan` placeholder with a mobile-optimized staff scan page.
- Update the staff desk to pass selected workshop context to the scan page through navigation state.
- Add camera QR scanning with `html5-qrcode` and a manual QR token entry fallback.
- Update check-in verification to accept `{ qrToken, workshopId? }`, look up registrations by `qrStub`, and return structured result statuses.
- Validate optional workshop matching and distinguish invalid QR, wrong workshop, not confirmed, already checked in, and newly checked in outcomes.
- Preserve offline batch sync scope for a later stage; this change only updates the single verify flow.

Non-goals:

- No offline local queue or sync UI in this change.
- No change to QR token generation; `qrStub` may still equal registration ID for now.
- No native mobile app; scanning remains web-based inside the staff mobile shell.

## Capabilities

### New Capabilities

- `staff-scan-ui`: Covers the `/manage/scan` staff page, camera/manual scan modes, selected workshop context, result states, loading state, and route wiring.

### Modified Capabilities

- `checkin-api`: Change single check-in verification from direct registration ID handling to QR token verification with structured status responses and optional workshop matching.
- `workshop-ui`: Staff workshop cards must navigate to the scan page with selected workshop ID and title state.
- `ui-routing-and-rbac`: Staff `/manage/scan` must render the real scan page inside `MobileShell` and remain role-protected.

## Impact

- Affected backend files: `apps/api/src/modules/checkins/checkins.routes.ts`, `checkins.controller.ts`, `checkins.service.ts`, `checkins.repository.ts`, `checkins.schema.ts`.
- Affected frontend files: `apps/web/src/pages/staff/Scan.tsx`, `apps/web/src/pages/staff/Desk.tsx`, `apps/web/src/router/index.tsx`.
- Dependency impact: add `html5-qrcode` to `apps/web`.
- API contract impact: `POST /api/v1/check-ins/verify` accepts QR token input and returns a structured check-in result instead of raw registration data.
