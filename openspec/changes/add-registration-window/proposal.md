## Why

Workshops currently allow registration at any time before the event, giving admins no control over when the registration period starts or ends. Adding an optional open/close window lets admins gate registrations precisely — e.g., open registration one week before, close it one day before — which is a standard event management requirement.

## What Changes

- `Workshop` model gains two optional fields: `registrationOpenAt` and `registrationCloseAt` (DB schema already migrated in Stage 1)
- Admin workshop create/update schema validates and persists both fields
- Registration service enforces the window at write time (400 errors if outside window)
- Public workshop API returns both fields so the frontend can compute window state
- Admin forms gain a "Registration Window" section with two optional datetime inputs
- Student workshop detail page shows a disabled, context-aware button when registration is closed or not yet open

**Non-goals:**
- No automatic email/notification when registration opens
- No per-capacity-slot windows (single window per workshop)
- No retroactive window enforcement on already-submitted registrations

## Capabilities

### New Capabilities

- `registration-window`: End-to-end enforcement of an optional registration open/close window on workshops — backend validation in admin schema and registration service, API field exposure, and frontend conditional UI on both admin forms and the student detail page.

### Modified Capabilities

- `admin-workshops`: Admin create/update schema and service now accept and persist `registrationOpenAt` / `registrationCloseAt` with cross-field validation.
- `workshop-registration`: Registration write path checks window before creating a record.
- `workshop-ui`: Student detail page button state is driven by computed window openness.
- `admin-workshop-crud-ui`: Admin create/edit forms include the new Registration Window section.

## Impact

- **Backend**: `apps/api/src/modules/admin-workshops/admin-workshops.schema.ts`, `admin-workshops.service.ts`, `apps/api/src/modules/registrations/registrations.service.ts`, `apps/api/src/modules/workshops/workshops.repository.ts`
- **Frontend**: `apps/web/src/pages/admin/workshops/WorkshopCreate.tsx`, `WorkshopEdit.tsx`, `apps/web/src/pages/student/WorkshopDetail.tsx`, workshop type definition in frontend store
- **API contract**: Public workshop response shape gains two nullable date fields — additive, non-breaking
- **No new dependencies**
