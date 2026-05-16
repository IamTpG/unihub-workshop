## Context

The UniHub Workshop system currently tracks registration statuses and provides a mobile ticket view for students. However, the bridge between the student's ticket and the staff check-in process needs to be solidified. We have a `checkin-api` module and a `qrStub` field in the database, but they are not yet fully integrated into the automated payment lifecycle.

## Goals / Non-Goals

**Goals:**
- Automate the generation of scannable QR stubs when a registration is confirmed.
- Standardize the check-in verification flow using the `registrationId`.
- Ensure the check-in process is idempotent and secure (Staff/Admin only).

**Non-Goals:**
- Implementing a physical QR scanner app (we assume staff will use the mobile web app with a scanner or manual entry).
- Handling offline-first check-in synchronization in this specific change (handled by existing `checkin-api` batch requirements).

## Decisions

- **QR Content**: The `qrStub` will contain only the `registrationId`.
    - **Rationale**: Simplifies the lookup logic and aligns with the user's explicit request. Using UUIDs for `registrationId` provides a sufficient level of security against simple guessing attacks.
- **Generation Trigger**: The `qrStub` will be populated in the `PaymentWebhookController` at the same time the `RegStatus` is updated to `PAID`.
    - **Rationale**: This ensures that as soon as the student receives a "Payment Successful" notification, their ticket is ready for scanning.
- **Check-in Verification**: The `CheckinsService` will continue to use the `registrationId` for lookups, as the `qrStub` is now a direct alias for the ID.

## Risks / Trade-offs

- [Risk] Unauthorized users scanning QR codes. → [Mitigation] The check-in endpoint remains protected by `requireRoles([Role.STAFF, Role.ADMIN])`.
- [Trade-off] Exposure of UUIDs in QR codes. → [Mitigation] Minimal risk as these IDs are already used in public-facing URLs (like `/my-registrations/:id/qr`).
