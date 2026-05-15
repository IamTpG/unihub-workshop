## 1. State Management (Developer A)

- [x] 1.1 Create `apps/web/src/stores/adminWorkshopStore.ts` with Zustand store containing: `workshops`, `pagination`, `currentWorkshop`, `workshopStats`, `isLoading`, `error` state, and actions: `fetchWorkshops(page, limit)`, `fetchWorkshop(id)`, `fetchWorkshopStats(id)`, `createWorkshop(data)`, `updateWorkshop(id, data)`
- [x] 1.2 Wire all store actions to the existing `api.ts` Axios instance, calling `GET /admin/workshops`, `GET /admin/workshops/:id`, `GET /admin/workshops/:id/stats`, `POST /admin/workshops`, `PUT /admin/workshops/:id`

## 2. Shared UI Components (Developer B)

- [x] 2.1 Create `components/ui/Select.tsx` — styled `<select>` with `label`, `error`, `options` props, matching the existing `Input` component pattern (same label style, border, focus transition)
- [x] 2.2 Create `components/ui/Textarea.tsx` — styled `<textarea>` with `label`, `error` props, matching the existing `Input` component pattern
- [x] 2.3 Create `components/ui/StatusBadge.tsx` — colored pill component accepting a `status` string (`DRAFT`, `PUBLISHED`, `CANCELLED`), rendering with appropriate color per status using CSS variables
- [x] 2.4 Create `components/ui/PageHeader.tsx` — renders a title `<h1>`, optional subtitle `<p>`, and optional right-aligned action slot (e.g. a `Button`), with consistent spacing
- [x] 2.5 Create `components/ui/DataTable.tsx` — generic table accepting `columns` (header label + row accessor) and `data` arrays, with built-in empty state and loading skeleton
- [x] 2.6 Create `components/ui/Pagination.tsx` — Previous/Next button pair driven by `page`, `totalPages`, and `onPageChange` callback, with disabled states at boundaries

## 3. Workshop Form Component (Developer A)

- [x] 3.1 Create `components/workshop/WorkshopForm.tsx` — full form layout using `Input`, `Select`, `Textarea`, `Button` from `ui/`. Accepts optional `initialData` prop for edit mode (pre-fills fields) and `onSubmit(data)` callback
- [x] 3.2 Implement client-side validation inside `WorkshopForm`: required title, positive capacity, endTime > startTime check. Display field-level errors via `Input`/`Select` error props

## 4. Workshop List Page (Developer A)

- [x] 4.1 Create `pages/admin/workshops/WorkshopList.tsx` — uses `PageHeader` (with "Create Workshop" action button), `DataTable` (columns: title, speaker, location, start time, `StatusBadge`, action links View/Edit), and `Pagination`
- [x] 4.2 Implement error banner using `Alert` with "Retry" action, and empty state inside `DataTable`

## 5. Workshop Create Page (Developer B)

- [x] 5.1 Create `pages/admin/workshops/WorkshopCreate.tsx` — uses `PageHeader` ("Create Workshop") and `WorkshopForm` with no `initialData`. On submit, calls `createWorkshop`, navigates to list on success, shows `Alert` error on failure

## 6. Workshop Detail Page (Developer B)

- [x] 6.1 Create `pages/admin/workshops/WorkshopDetail.tsx` — uses `PageHeader` (with "Edit" action button), `Card` for stat blocks (registration counts by status, total), and `StatusBadge` for workshop status
- [x] 6.2 Implement loading state, 404 not-found state with back link

## 7. Workshop Edit Page (Developer A)

- [x] 7.1 Create `pages/admin/workshops/WorkshopEdit.tsx` — uses `PageHeader` ("Edit Workshop") and `WorkshopForm` with `initialData` loaded from `fetchWorkshop(id)`. On submit, calls `updateWorkshop(id, data)`, navigates to detail view on success
- [x] 7.2 Implement loading state while fetching, 404 not-found state with back link

## 8. Router Integration (Developer B)

- [x] 8.1 Update `apps/web/src/router/index.tsx` — add child routes under `/admin`: `workshops` → WorkshopList, `workshops/new` → WorkshopCreate, `workshops/:id` → WorkshopDetail, `workshops/:id/edit` → WorkshopEdit
- [x] 8.2 Verify all routes render inside `AdminShell` layout and sidebar "Manage Workshops" link highlights correctly

## 9. Visual Polish and Verification (Both)

- [x] 9.1 Ensure all components use existing CSS variables (`--accent`, `--border`, `--bg`, `--text`, `--text-h`, `--shadow`, `--error`, `--success`) and inline style pattern consistent with existing `ui/` components
