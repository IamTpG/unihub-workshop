## Why

The admin-workshops API (CRUD + stats) is fully implemented and tested, but the web admin panel only renders a placeholder `<h1>Manage Workshops</h1>` at `/admin/workshops`. Without a real management UI, demo sessions require Postman, which undermines the "shippable MVP and demoability" course requirement. This change delivers a desktop-first admin CRUD interface so workshops can be created, listed, edited, and inspected entirely from the browser.

## What Changes

- **Add an admin workshop list page** at `/admin/workshops` with a paginated data table showing all workshops, status badges, and quick action links (view/edit).
- **Add an admin workshop create page** at `/admin/workshops/new` with a validated form matching the `createWorkshopSchema` fields (title, description, speaker, location, dates, capacity, price, PDF URL, room-layout URL, status).
- **Add an admin workshop edit page** at `/admin/workshops/:id/edit` with a pre-filled form matching the `updateWorkshopSchema` fields and in-place save.
- **Add an admin workshop detail page** at `/admin/workshops/:id` showing full workshop data plus registration stats fetched from `GET /admin/workshops/:id/stats`.
- **Add an admin workshop Zustand store** (`adminWorkshopStore.ts`) handling API calls to the existing `/admin/workshops` endpoints with loading and error state.
- **Update the router** to register the four new routes under the existing `/admin` layout.

## Capabilities

### New Capabilities
- `admin-workshop-crud-ui`: Admin-facing web pages for creating, listing, viewing, editing, and inspecting workshop details and registration statistics.

### Modified Capabilities
_None — no existing spec requirements are changing. The backend `admin-workshops` API is consumed as-is._

## Impact

- **Frontend only** — no API or database changes.
- **Files added**: ~5 new page components under `apps/web/src/pages/admin/workshops/`, 1 new store under `apps/web/src/stores/`.
- **Files modified**: `apps/web/src/router/index.tsx` (new child routes under `/admin`).
- **Dependencies**: Uses the existing `api.ts` Axios instance and design-system CSS variables from `index.css`.
- **Non-goals**: Soft-delete/archive, bulk operations, image upload widget, real-time refresh via WebSocket, mobile responsiveness for admin panel.
