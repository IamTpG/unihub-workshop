## 1. Backend — Admin Workshop Schema

- [x] 1.1 Add `registrationOpenAt: z.coerce.date().optional()` and `registrationCloseAt: z.coerce.date().optional()` to `workshopRawShape` in `admin-workshops.schema.ts`
- [x] 1.2 Add `.superRefine` cross-field validation to `createWorkshopSchema`: if both set, open must be before close; if close set, must be ≤ endTime
- [x] 1.3 Add the same `.superRefine` validation to `updateWorkshopSchema`
- [x] 1.4 Confirm both fields are included in the Prisma `create` and `update` data objects in `admin-workshops.service.ts`

## 2. Backend — Registration Service Window Check

- [x] 2.1 After fetching the workshop in the registration service, add a time-gate check: if `registrationOpenAt` set and `now < registrationOpenAt`, throw `400 "Registration is not open yet"`
- [x] 2.2 Add check: if `registrationCloseAt` set and `now > registrationCloseAt`, throw `400 "Registration is closed"`
- [x] 2.3 Verify no Redis decrement or DB write occurs when the window check rejects the request

## 3. Backend — Public Workshop API

- [x] 3.1 Add `registrationOpenAt` and `registrationCloseAt` to the Prisma `select` in the workshop list query in `workshops.repository.ts`
- [x] 3.2 Add both fields to the Prisma `select` in the workshop detail query in `workshops.repository.ts`
- [x] 3.3 Verify that both fields appear in the JSON response for `GET /workshops` and `GET /workshops/:id`

## 4. Frontend — Workshop Type Update

- [x] 4.1 Add `registrationOpenAt: string | null` and `registrationCloseAt: string | null` to the workshop type in the frontend store (used by both admin and student pages)

## 5. Frontend — Admin Workshop Forms

- [x] 5.1 Add a "Registration Window" section to `WorkshopCreate.tsx` with two `datetime-local` inputs: `registrationOpenAt` and `registrationCloseAt`; add helper note "Leave blank to allow registration at any time"
- [x] 5.2 Add client-side validation in `WorkshopCreate.tsx`: if both window fields are filled, reject submission when open ≥ close
- [x] 5.3 Add the same "Registration Window" section to `WorkshopEdit.tsx` with pre-population of existing values (converted to `datetime-local` format)
- [x] 5.4 Add the same client-side validation to `WorkshopEdit.tsx`
- [x] 5.5 Ensure both forms include window fields in the submit payload (ISO 8601 or omitted/null when blank)

## 6. Frontend — Student Workshop Detail CTA

- [x] 6.1 In `WorkshopDetail.tsx`, compute `isRegistrationOpen` from `registrationOpenAt`, `registrationCloseAt`, and `Date.now()`
- [x] 6.2 If `registrationOpenAt` is set and now is before it: render CTA button as disabled with text "Opens [formatted date]"
- [x] 6.3 If `registrationCloseAt` is set and now is past it: render CTA button as disabled with text "Registration Closed"
- [x] 6.4 Otherwise (no window or within window): render normal enabled register CTA

## 7. Post-Deploy Verification

- [x] 7.1 Flush stale Redis detail cache after API deploy: delete keys matching `workshop:*:detail` (or wait for 5-minute TTL expiry)
- [ ] 7.2 Smoke-test: set `registrationOpenAt` in the future on a published workshop; confirm student detail shows "Opens [date]" button and API returns 400 on a programmatic registration attempt
- [ ] 7.3 Smoke-test: set `registrationCloseAt` in the past; confirm student sees "Registration Closed" and API rejects with 400
