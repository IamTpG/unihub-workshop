## Context

The staff `/manage` area is protected by the web route guard and rendered in `MobileShell`, but `/manage/scan` currently shows a static placeholder. The backend check-in module exists, but the single check-in flow currently centers on direct `registrationId` handling while the staff scanner should verify the QR token carried by the student's ticket.

This change bridges backend verification and staff mobile UX. It keeps the offline batch sync endpoint unchanged for the later offline queue stage.

Critical flows:

1. Staff selects workshop: staff opens `/manage` -> taps a workshop card -> `Desk.tsx` navigates to `/manage/scan` with `{ workshopId, workshopTitle }` in route state.
2. Camera scan: `Scan.tsx` starts `html5-qrcode` using the rear camera when available -> decoded QR text becomes `qrToken` -> page posts `{ qrToken, workshopId }` to `/api/v1/check-ins/verify`.
3. Manual check-in: staff toggles to manual mode -> enters QR token -> submits the same verify payload.
4. Backend verify: API validates `{ qrToken, workshopId? }` -> finds `Registration` by `qrStub` -> optionally validates matching workshop -> returns a structured status result -> atomically sets `checkedInAt` only for eligible unchecked registrations.
5. Result reset: scan page shows a prominent result state, waits 3 seconds, clears the result, and resumes scanning/manual entry.

## Goals / Non-Goals

**Goals:**

- Provide a mobile-friendly staff scan page at `/manage/scan`.
- Support camera QR scanning and manual token entry.
- Return structured check-in statuses instead of ambiguous raw registration data.
- Verify QR tokens through `registration.qrStub` and optional workshop matching.
- Keep staff flow usable even if camera permission fails by offering manual input.

**Non-Goals:**

- No offline queue or batch sync UI.
- No QR token generation redesign.
- No ADMIN web scan route; this stage targets the existing STAFF `/manage` route.
- No native mobile camera implementation outside browser APIs.

## Decisions

1. Use `html5-qrcode` for camera scanning.

   Rationale: it provides browser camera access and QR decoding without custom canvas work, and it can prefer the rear camera with facing mode constraints.

   Alternative considered: `@zxing/browser`. Rejected for this slice because `html5-qrcode` has a simpler scanner lifecycle for a single QR div and is acceptable for the current mobile web scope.

2. Add `POST /api/v1/check-ins/verify` rather than overloading the existing `/:registrationId` path.

   Rationale: the desired payload is body-based and QR-token oriented. A stable `/verify` endpoint avoids path ambiguity and makes the contract clearer for camera/manual clients.

   Alternative considered: keep `POST /check-ins/:registrationId`. Rejected because QR tokens should not be treated as route IDs, especially when token generation becomes opaque later.

3. Return domain statuses in the response body.

   Rationale: staff needs clear visual outcomes for fast door operations. A consistent `status` enum maps directly to green/yellow/red UI states.

   Alternative considered: use HTTP errors for invalid QR and wrong workshop. Rejected because the scanner UI benefits from a normal JSON result for all scan outcomes.

4. Keep double check-in idempotent.

   Rationale: repeated scans are common at entrances. Returning `ALREADY_CHECKED_IN` with the existing timestamp is safer than failing hard.

   Alternative considered: treat duplicate scan as error. Rejected because it slows staff down and does not change data.

5. Pass selected workshop context through router state.

   Rationale: it is the smallest change from the existing desk flow and avoids introducing global staff selection state.

   Alternative considered: route param `/manage/scan/:workshopId`. Rejected for now because the requested route is `/manage/scan` and state is enough for this workflow.

## Risks / Trade-offs

- Route state is lost on refresh -> The scan page should still work manually without `workshopId`, but cannot show a selected workshop title after refresh.
- Camera permission may be denied or unavailable -> The manual input mode remains available and camera errors should be shown without blocking manual check-in.
- `qrStub` currently equals registration ID -> This change still reads `qrStub`, so future opaque token generation can replace values without changing the scan page contract.
- Fast repeated scan callbacks can duplicate API calls -> The page should ignore scans while loading or while a result is displayed.
- Structured failures returned with HTTP 200 can look unusual -> This is intentional for scan-result UX; authorization and validation errors still use normal HTTP error handling.
