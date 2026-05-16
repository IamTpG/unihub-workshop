## Context

The backend admin-workshops module is complete with five endpoints (`POST /`, `GET /`, `GET /:id`, `PUT /:id`, `GET /:id/stats`) protected by `authenticate` + `requireRoles([Role.ADMIN])`. The web admin panel (`/admin`) already has a working shell layout (`AdminShell`) with sidebar navigation, but the "Manage Workshops" route renders an empty placeholder. The student-facing UI uses Zustand stores for state and the shared `api.ts` Axios instance with JWT auto-attach and silent refresh.

## Goals / Non-Goals

**Goals:**
- Provide a complete admin CRUD workflow (list → create → view detail/stats → edit) in the browser.
- Reuse existing design tokens (`--accent`, `--border`, `--bg`, etc.) and the inline-style pattern used by `AdminDashboard` for visual consistency.
- Deliver a demo-ready experience with proper loading states, error feedback, and paginated navigation.

**Non-Goals:**
- Mobile/responsive optimization for the admin panel (desktop-only audience).
- Real-time WebSocket updates or polling for list changes.
- Image/PDF file upload widget — the form accepts URL strings only, matching the API contract.
- Soft-delete, archive, or bulk operations.
- Unit/integration test scaffolding (test strategy deferred to a separate change).

## Decisions

### 1. Dedicated `adminWorkshopStore` vs. extending `workshopStore`

**Decision:** Create a new `adminWorkshopStore.ts` separate from the existing student `workshopStore.ts`.

**Rationale:** The admin store calls `/admin/workshops` (different base path, different response shape with pagination metadata) and manages form-mutation state (create/update loading, success, error). Mixing admin concerns into the student store violates the modular boundary and would require role-checking inside store actions.

**Alternative considered:** Shared generic workshop store with role-based endpoint selection — rejected for coupling complexity.

### 2. Page component per route vs. single page with tabs

**Decision:** One page component per route: `WorkshopList`, `WorkshopCreate`, `WorkshopEdit`, `WorkshopDetail`.

**Rationale:** Each view has distinct data requirements (list needs pagination, detail needs stats, create/edit need form state). Separate components keep cognitive load low, are independently lazy-loadable, and match the existing router pattern where each route has its own element.

**Alternative considered:** Single `ManageWorkshops` page with tabs — rejected because it makes URL-sharing and browser back-navigation harder.

### 3. Inline styles vs. CSS modules

**Decision:** Continue using `React.CSSProperties` inline style objects, the same pattern as `AdminDashboard` and `AdminShell`.

**Rationale:** The project already uses this convention exclusively. Introducing CSS modules would create an inconsistency and require build config changes. Inline styles are sufficient for the admin panel's complexity level.

### 4. Form validation approach

**Decision:** Client-side validation using native HTML attributes (`required`, `type="datetime-local"`, `min`) plus a light pre-submit check (endTime > startTime). Server-side Zod validation remains the authority.

**Rationale:** Keeps the frontend simple — no new form library dependency. The Zod schemas already enforce full validation on the API; client checks are UX sugar to prevent obvious mistakes.

**Alternative considered:** Importing Zod schemas from a shared package — rejected because the monorepo doesn't currently share code between `apps/api` and `apps/web`.

### 5. Routing structure

**Decision:** Nest new routes as children of the existing `/admin` route in the router:
```
/admin/workshops        → WorkshopList
/admin/workshops/new    → WorkshopCreate
/admin/workshops/:id    → WorkshopDetail
/admin/workshops/:id/edit → WorkshopEdit
```

**Rationale:** Follows REST conventions, is URL-shareable, and naturally inherits the `AdminShell` layout with sidebar and header.

### 6. Component decomposition strategy

**Decision:** Extract shared UI pieces into reusable components rather than duplicating markup across pages.

**New shared components** (under `components/ui/`):
| Component | Purpose | Reused by |
|---|---|---|
| `Select` | Styled `<select>` matching the `Input` pattern (label, error, variants) | WorkshopForm (status dropdown) |
| `Textarea` | Styled `<textarea>` matching the `Input` pattern | WorkshopForm (description) |
| `StatusBadge` | Colored pill rendering workshop status (`DRAFT`, `PUBLISHED`, `CANCELLED`) | WorkshopList table rows, WorkshopDetail |
| `DataTable` | Generic table wrapper with header definition array, row rendering, and built-in empty/loading states | WorkshopList (can be reused for future admin tables) |
| `PageHeader` | Title + subtitle + optional action button (e.g. "Create Workshop") with consistent spacing | All 4 admin pages |
| `Pagination` | Previous/Next controls driven by `{ page, totalPages }` | WorkshopList |

**Domain component** (under `components/workshop/`):
| Component | Purpose | Reused by |
|---|---|---|
| `WorkshopForm` | Full form layout for workshop fields, uses `Input`, `Select`, `Textarea`, `Button` from `ui/`. Accepts `initialData?` prop to switch between create (empty) and edit (pre-filled) modes. Exposes `onSubmit(data)` callback. Handles client-side validation internally. | WorkshopCreate, WorkshopEdit |

**Existing primitives leveraged** (no changes needed):
- `Button` — form submit, retry actions
- `Input` — text/number/URL/datetime-local fields in WorkshopForm
- `Alert` — inline error banners on all pages
- `Card` — stat cards in WorkshopDetail

**Rationale:** The create and edit forms share ~90% identical fields. Without extraction, the same 10+ field layout would be copy-pasted. `StatusBadge` appears in both list and detail. `PageHeader` standardizes the top section across all admin pages. The `DataTable` abstraction keeps the list page focused on data concerns rather than table styling.

**Alternative considered:** Keeping everything inline per page — rejected because the form duplication alone would be ~150 lines of identical JSX.

## Sequence: Create Workshop Flow

1. Admin navigates to `/admin/workshops/new`.
2. `WorkshopCreate` renders an empty form.
3. Admin fills in fields and clicks "Create Workshop".
4. Component calls `adminWorkshopStore.createWorkshop(data)`.
5. Store sends `POST /admin/workshops` via `api.post`.
6. **Success:** Store clears form state, component navigates to `/admin/workshops` with a success toast.
7. **Validation error (400):** Store captures `error.response.data.message`, component shows inline error banner.
8. **Network/server error (5xx):** Store captures generic message, component shows error banner with "Retry" option.

## Sequence: Edit Workshop Flow

1. Admin navigates to `/admin/workshops/:id/edit`.
2. `WorkshopEdit` calls `adminWorkshopStore.fetchWorkshop(id)` on mount.
3. **If not found (404):** Component renders a "Workshop not found" message with a back link.
4. **If found:** Form pre-populates with existing data.
5. Admin modifies fields and clicks "Save Changes".
6. Component calls `adminWorkshopStore.updateWorkshop(id, data)`.
7. **Success:** Navigate to `/admin/workshops/:id` detail view.
8. **Error:** Same inline error handling as create flow.

## Failure Isolation and Fallback Behavior

- **API unreachable:** All store actions catch Axios errors and set an `error` string in state. Pages render a visible error banner. No silent failures.
- **Token expiry during admin action:** The existing `api.ts` response interceptor handles 401 → refresh → retry transparently. If refresh also fails, user is logged out.
- **Stale list after mutation:** After create/update success, the list is re-fetched from the server to guarantee consistency. No optimistic UI.
- **Navigation guard:** The admin route tree is already wrapped in `<ProtectedRoute allowedRoles={['ADMIN']}>`, so non-admin users cannot access these pages.

## Risks / Trade-offs

- **[Risk] Inline styles become verbose** → Mitigated by extracting reusable style objects at the module level (same as Dashboard pattern). If a future change introduces a design system, migration is straightforward.
- **[Risk] No optimistic updates** → Acceptable for admin panel with low concurrency. Simplifies error handling.
- **[Risk] No form library** → Acceptable for the current form complexity (~10 fields). If forms grow significantly, consider `react-hook-form` in a follow-up.
- **[Risk] Hardcoded pagination controls** → MVP ships with previous/next buttons. Full pagination with page number buttons deferred.
