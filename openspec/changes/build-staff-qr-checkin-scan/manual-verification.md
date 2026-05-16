## Manual Verification Notes

### Backend Check-In Verify

- Authenticate as `STAFF`.
- `POST /api/v1/check-ins/verify` with a valid `qrToken` for an unchecked `PAID` registration.
  - Expect `status = "CHECKED_IN"` and `checkedInAt`.
- Repeat the same request.
  - Expect `status = "ALREADY_CHECKED_IN"` and the original `checkedInAt`.
- Send an unknown `qrToken`.
  - Expect `status = "INVALID_QR"`.
- Send a valid `qrToken` with a different `workshopId`.
  - Expect `status = "WRONG_WORKSHOP"` and no check-in update.
- Send a valid `qrToken` for a registration not in `PAID` status.
  - Expect `status = "NOT_CONFIRMED"` with the registration status in the message.
- Authenticate as `STUDENT` and call `/api/v1/check-ins/verify`.
  - Expect `403 Forbidden`.

### Frontend Staff Scanner

- Open `/manage` as `STAFF` and tap a workshop card.
  - Expect navigation to `/manage/scan` with the workshop title in the top bar.
- Open `/manage/scan` directly.
  - Expect generic scan title and manual check-in still available.
- Switch between Camera and Manual modes.
  - Expect large tap targets and stable layout.
- Deny camera permission.
  - Expect a camera error and manual mode remains usable.
- Submit an empty manual token.
  - Expect inline validation and no API request.
- Submit a valid token.
  - Expect loading state, then green checked-in result, then auto-reset after 3 seconds.
- Submit already checked-in, invalid QR, wrong workshop, and not-confirmed cases.
  - Expect yellow/red result cards matching each status.
