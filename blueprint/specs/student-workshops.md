# Specification: Student Workshops

## Description

Students use this capability to **discover published workshops**, see **accurate remaining seats**, and open a **detail view** before registering. The system is optimized for read-heavy spike traffic: workshop metadata may be cached briefly, but seat counts must reflect live availability.

Only workshops with status `PUBLISHED` are visible. Draft, hidden, or cancelled workshops must never appear in student discovery.

---

## Main Flow

### 1. Browse published workshops

1. An authenticated **student** opens the workshop explore view (`/workshops`).
2. The system loads the published catalog and shows a chronological list of workshops.
3. Each entry shows title, schedule, location, speaker, price, seats remaining, and whether the student is already registered.
4. If the catalog is empty, the system shows an empty state. If loading fails, the system shows an error with a retry action.

**List API:** `GET /api/v1/workshops?page=&limit=`  
- Default `page=1`, `limit=10` (max 100).  
- Response: `{ items[], pagination: { total, page, limit, totalPages } }` wrapped in standard `{ success, message, data }`.

**List item fields:** `id`, `title`, `speakerName`, `location`, `startTime`, `endTime`, `capacity`, `availableSlots`, `price`, `aiSummary`, `hasPdf`, `registrationOpenAt`, `registrationCloseAt`.

**Must not expose:** `pdfUrl`, `roomLayoutUrl`, `description`, workshop internal status.

### 2. View workshop detail

1. The student selects a workshop from the list (or navigates to `/workshops/:id`).
2. The system shows full detail: description, room layout image (if any), presenter, capacity, live seats, price, and AI summary state.
3. A sticky action area offers registration when allowed (see §4).
4. If the workshop does not exist or is not published, the system shows not found and offers navigation back.

**Detail API:** `GET /api/v1/workshops/:id`  
**Additional fields vs list:** `description`, `roomLayoutUrl`. Still no `pdfUrl` — only `hasPdf`.

### 3. Refresh availability only

When only seat count needs updating, the system may call:

**API:** `GET /api/v1/workshops/:id/availability` → `{ availableSlots: number }`

### 4. Registration affordances on list and detail

The same rules apply on workshop cards and the detail page:

| State | Condition | Action shown |
|-------|-----------|--------------|
| Registered | Student already has active registration for this workshop | Disabled — “Registered” |
| Not open yet | `now < registrationOpenAt` | Disabled — “Upcoming” / “Opens {date}” on detail |
| Closed | `now > registrationCloseAt` | Disabled — “Closed” / “Registration Closed” |
| Full | `availableSlots === 0` | Disabled — “Full” / “Fully Booked” |
| Open | Otherwise | Enabled — register (free: confirm dialog; paid: continues to payment flow) |

Registering invokes `registration-and-payment.md`; after success, seat counts on the list should refresh.

### 5. AI summary presentation

On the detail view:

- If `aiSummary` is present → show summary text.
- If `hasPdf` is true and `aiSummary` is null → show “Summary processing…”.
- If no PDF and no summary → do not show a summary section.

### 6. Staff workshop selection (check-in desk)

Staff at `/manage` need a chronological, day-grouped list of workshops to select before scanning. Selection navigates to scan with `workshopId` and title. Staff must not use student-only register actions on those cards.

> **Gap:** Student list API is role-restricted to `STUDENT`; staff desk requires a compatible published-workshop list API (see `check-in-and-offline.md`).

---

## Access Control

- Workshop discovery APIs (`GET /workshops`, `GET /workshops/:id`, `GET /workshops/:id/availability`) require authentication and role **`STUDENT`**.
- Unauthenticated → `401`. Other roles → `403`.

---

## Caching & Live Seats

The system separates **stable metadata** from **live seat counts**:

| Concern | Behavior |
|---------|----------|
| Published catalog | Cached in Redis for up to **5 minutes**, then reloaded from database. On cache failure, load from database directly. |
| Workshop detail metadata | Cached per workshop in Redis for up to **5 minutes** (metadata excludes live slots). |
| Live seats | Read from Redis slot counter when present; otherwise use database `available_slots`. List view merges all slot keys in **one batch** per request. |
| Organizer edits | Invalidate published list and detail cache; refresh slot key when capacity changes. |

Students must always see the best available seat count: prefer live slot keys over stale cached metadata values.

---

## Data Model (student-visible)

Workshop discovery reads the `Workshop` entity. Student responses never include `pdfUrl`; `hasPdf` indicates PDF exists for summary generation.

Registration window fields (`registrationOpenAt`, `registrationCloseAt`) are optional; when null, time-gating is skipped for display and registration (registration API enforces separately).

---

## Error Scenarios

| Scenario | System behavior |
|----------|-----------------|
| Invalid pagination (`page` / `limit`) | `400` validation error |
| Workshop not found or not published | `404` on detail and availability |
| Non-student calls discovery API | `403` |
| Cache unavailable | Still return published workshops from database; degrade slot merge if needed |
| Network failure on explore view | Error message with retry |
| Detail not found in UI | “Workshop Not Found” with back navigation |

---

## Constraints

- Only **`PUBLISHED`** workshops appear in discovery.
- **`pdfUrl`** must never be returned to students; use **`hasPdf`** only.
- **`availableSlots`** on list and detail must reflect live counters when available.
- Discovery must remain available when payment services are degraded (read-only path).
- Pagination is applied after building the full published catalog (acceptable for MVP event size).
- Registration window shown in UI must match server enforcement on `POST .../register`.

---

## Acceptance Criteria

- Students can list only published workshops with pagination metadata.
- List items include live `availableSlots` and exclude internal URLs.
- Students can view detail for a published workshop including description and room layout.
- Detail returns `404` for non-published or missing workshops.
- Availability endpoint returns current seat count or `404`.
- Non-students cannot call discovery APIs.
- Catalog cache is used when valid; database fallback works when cache fails.
- List performs a single batch slot lookup for all workshops on the page.
- Explore view handles loading, empty, and error states with retry.
- Cards and detail show correct register / upcoming / closed / full / registered states.
- AI summary card follows present / processing / hidden rules.
- Free registration prompts confirmation; paid registration continues to payment flow.
- After registration, visible seat counts update.

