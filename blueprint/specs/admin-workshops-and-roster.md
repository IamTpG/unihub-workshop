# Specification: Admin Workshops & Student Roster

## Description

Organizers (**ADMIN** role) use this capability to **plan workshops**, control **visibility and capacity**, set optional **registration windows**, inspect **registration statistics**, and maintain the **canonical student roster** imported from the legacy campus system (CSV export only—no live SIS integration).

Student-facing discovery and registration depend on this data: only **PUBLISHED** workshops appear to students; only students with an **ACTIVE** `StudentRecord` may log in and register.
---

## Main Flow

### 1. Manage workshops (organizer console)

An authenticated organizer uses the admin console under `/admin` (default landing: workshop list).

| View | Route | Purpose |
|------|-------|---------|
| List | `/admin/workshops` | Paginated table of all workshops (any status) |
| Create | `/admin/workshops/new` | New workshop form |
| Detail | `/admin/workshops/:id` | Full fields + registration stats |
| Edit | `/admin/workshops/:id/edit` | Update workshop |
| Import roster | `/admin/students/import` | Upload student CSV |

List and detail views show loading, error-with-retry, and empty states. Pagination moves between pages when total workshops exceed the page size.

### 2. Create a workshop

1. Organizer submits title, schedule (`startTime`, `endTime` with end after start), capacity, price, status, and optional metadata (description, speaker, location).
2. Optional **registration window**: `registrationOpenAt`, `registrationCloseAt` (both optional; if both set, open must be before close; close must not be after workshop `endTime`).
3. The system creates the workshop with **`availableSlots = capacity`**.
4. On success, the organizer is returned to the workshop list; student discovery caches for published catalogs are invalidated when relevant.

**API:** `POST /api/v1/admin/workshops`

Invalid payloads are rejected with validation errors; no partial record is created.

### 3. Update a workshop

1. Organizer changes any subset of fields (including status and registration window).
2. The system persists updates and invalidates cached student list/detail data for that workshop.
3. If status moves to **DRAFT**, **HIDDEN**, or **CANCELLED**, live slot counters for that workshop are cleared so stale availability is not shown.

**API:** `PUT /api/v1/admin/workshops/:id`

### 4. View workshop statistics

On the detail view, the system shows registration counts **by status** (e.g. `PAID`, `HOLDING`, `PENDING`, `FAILED`, `EXPIRED`, `CANCELLED`), **total registrations**, and **checked-in count**.

**API:** `GET /api/v1/admin/workshops/:id/stats`

### 5. Upload room layout image

1. Organizer uploads an image (JPEG, PNG, or WebP, max **5 MB**) for an existing workshop.
2. The system stores the file and sets `roomLayoutUrl` on the workshop.
3. Student detail views may show this layout (see `workshops-and-discovery.md`).

**API:** `POST /api/v1/admin/workshops/:id/room-layout` (multipart field `image`)

### 6. Upload workshop PDF (AI summary)

1. Organizer uploads or replaces a PDF (max **10 MB**, `application/pdf`) for a workshop.
2. The system stores the file, updates internal PDF reference, clears any previous AI summary, and starts **asynchronous summary generation**.
3. Organizer receives acceptance that processing has started; summary text appears on student detail when ready (`ai-summary.md`).

**API:** `POST /api/v1/admin/workshops/:id/pdf` (multipart field `pdf`) → `202`

Legacy create/update forms may still accept a `pdfUrl` string; file upload is the preferred path for MVP.

### 7. List and inspect workshops (API)

| API | Purpose |
|-----|---------|
| `GET /api/v1/admin/workshops` | Paginated list (all statuses) |
| `GET /api/v1/admin/workshops/:id` | Single workshop (organizer-visible fields) |
| `PUT /api/v1/admin/workshops/:id` | Update |
| `GET /api/v1/admin/workshops/:id/stats` | Detail + registration breakdown |

Default pagination: `page=1`, `limit=10` (max 100).

### 8. Import student roster (CSV)

1. Organizer uploads a **CSV** file with required columns: `studentId`, `email`, `fullName` (optional column `status`, default **ACTIVE**).
2. The system validates headers and file type, creates an **import log** (`PENDING`), stores the file temporarily, and returns **`202`** with `{ importLogId }`.
3. Processing runs **asynchronously**: each row is validated and upserted; one bad row does not abort the entire file.
4. Organizer may view recent import logs (latest **20**) with counts: inserted, updated, skipped, failed, and final status (`DONE` / `FAILED`).

**APIs:**

- `POST /api/v1/admin/import/students` — multipart CSV upload  
- `GET /api/v1/admin/import/logs` — recent logs  

**Row rules:**

| Case | Outcome |
|------|---------|
| New `studentId` | Insert `StudentRecord`, `ACTIVE` unless specified |
| Existing `studentId` | Update email, name, status |
| Duplicate `studentId` in same file | Last row wins; earlier duplicates counted **skipped** |
| Invalid email or missing required fields | Row **failed**, continue |
| Email already tied to a different `studentId` | Row **failed**, existing record unchanged |

After import, temporary upload files are deleted.

### 9. Roster enforcement (downstream)

- **OTP login** and **workshop registration** require the student’s email to exist on `StudentRecord` with `status = ACTIVE`.
- The roster is **one-way** from CSV; there is no API sync back to the legacy SIS.

---

## Access Control

All capabilities in this specification require authentication and role **`ADMIN`**.

- Unauthenticated → `401`  
- `STUDENT` or `STAFF` → `403`  

Applies to workshop admin APIs, PDF/room uploads, and student import APIs.

---

## Workshop Status & Visibility

| Status | Student discovery |
|--------|-------------------|
| `PUBLISHED` | Visible in student list/detail |
| `DRAFT`, `HIDDEN`, `CANCELLED` | Not visible to students |

Organizers see all statuses in the admin list.

---

## Data Model

### Workshop (organizer-managed)

Key fields: `title`, `description`, `speakerName`, `location`, `roomLayoutUrl`, `pdfUrl`, `startTime`, `endTime`, `capacity`, `availableSlots`, `price`, `status`, `registrationOpenAt`, `registrationCloseAt`, `aiSummary`.

On create: `availableSlots` initialized to `capacity`.

### StudentRecord

```
studentId (unique), email (unique), fullName, status, importedAt, updatedAt
```

### ImportLog

```
filename, totalRows, inserted, updated, skipped, failed, status (PENDING | DONE | FAILED)
```

---

## Side Effects on Student Experience

When organizers create or update workshops (especially status, capacity, or schedule):

- Published workshop **catalog cache** is invalidated (students may see updates within cache TTL otherwise).
- Per-workshop **detail cache** is invalidated.
- **Live slot keys** are reset or removed when a workshop is unpublished or cancelled.

---

## Error Scenarios

| Scenario | Behavior |
|----------|----------|
| Non-admin access | `403` |
| Workshop not found | `404` on get/update/stats/upload |
| Invalid dates (end before start, window after event end) | `400` validation |
| `startTime` in the past on create | `400` |
| Room image wrong type or > 5 MB | `400` |
| PDF not PDF or > 10 MB | `400` |
| CSV missing columns or not CSV | `400`, no job enqueued |
| Import file unreadable | Import log `FAILED` |
| List/detail UI fetch failure | Error message + retry |
| Create/update server error | Inline error; form retains input |

---

## Constraints

- **No live SIS integration** — roster only via CSV export/import.
- **Import must not block** online student traffic — processing is async.
- **Row-level fault isolation** on CSV — partial success is normal.
- **Capacity vs slots:** `availableSlots` tracks remaining seats; organizer sets `capacity` at create; registration flow decrements slots (`registration-and-payment.md`).
- **Registration window** optional; null open/close means no time gate (enforced again at registration API).
- **AI summary** is eventual consistency after PDF upload; workshop may show “processing” until complete.
- Organizers cannot delete workshops via API in MVP (status `CANCELLED` / `HIDDEN` instead).

---

## Acceptance Criteria

### Workshop management

- Only ADMIN can call `/api/v1/admin/workshops` and sub-routes.
- Create sets `availableSlots` equal to `capacity`.
- List returns pagination metadata; invalid pagination returns `400`.
- Update returns `404` for missing workshop.
- Stats include per-status counts, total, and checked-in count.
- Registration window validation rejects open ≥ close and close after `endTime`.
- Room layout upload accepts allowed image types and updates `roomLayoutUrl`.
- PDF upload returns `202` and triggers summary job; invalid file rejected.

### Organizer console

- `/admin/workshops` lists workshops with pagination and actions (view, edit).
- Create and edit forms validate end after start; registration window section works.
- Detail page shows stats and link to edit.
- Loading, empty, and error states behave as specified.

### Student import

- CSV upload returns `202` and `importLogId`.
- Non-admin cannot upload or list logs.
- Bad rows increment `failed` without stopping valid rows.
- Duplicate email across different student IDs fails that row only.
- Import log reaches `DONE` or `FAILED` with accurate counts.
- Temp CSV file removed after processing.
- ACTIVE imported students can use OTP and registration; inactive cannot.
