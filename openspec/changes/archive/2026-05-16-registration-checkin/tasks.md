## 1. Backend: QR Stub Generation

- [x] 1.1 Update `PaymentWebhookController` in `payment-webhook.controller.ts` to set `qrStub` strictly to the `registrationId` upon successful payment.
- [x] 1.2 Verify that no other logic (e.g. background workers) is overwriting the `qrStub` with other formats.

## 2. Backend: Check-in API & Integration

- [x] 2.1 Verify `CheckinsService.checkInSingle` correctly validates the `PAID` status and handles the check-in timestamp.
- [x] 2.2 Ensure the `POST /checkins` routes are correctly registered and protected by `requireRoles([Role.STAFF, Role.ADMIN])`.
- [x] 2.3 Test the check-in endpoint using the raw `registrationId` as input.

## 3. Data & Validation

- [x] 3.1 Update `prisma/seed.ts` to ensure seeded `PAID` registrations have `qrStub` set to their actual `id` to match the new system behavior.
- [x] 3.2 Run the seed script and verify the data in the database.
