## Why

The system needs a beautiful, intuitive interface for students to discover available workshops and view detailed schedules, seating availability, and pricing. This feature is critical for the MVP's core demoability and fulfills the fundamental course requirement of allowing users to discover and register for tech events using a premium, system-aware mobile layout.

## What Changes

- Build a dedicated Workshop List view to present dynamic workshop cards grouped by date.
- Build a dedicated Workshop Details view to show expanded information (presenter info, capacity, detailed summary, price).
- Integrate the newly created `useWorkshopStore` and backend repository data to feed live data into both the List and Details views.
- Expand router paths to support `/workshops/:id` for individual workshop pages.
- Ensure the UI natively consumes system CSS variables (`var(--bg)`, `var(--accent)`) to match the existing premium aesthetic.
- **Non-Goal**: Actual payment processing or complex booking transactions are excluded from this specific slice (focus is UI presentation).

## Capabilities

### New Capabilities
- `workshop-list-ui`: Presentation of the dynamic, date-grouped list of workshops with interactive cards and availability badging.
- `workshop-details-ui`: Presentation of individual workshop data, including presenter, room capacity, detailed summary, and a sticky registration call-to-action button at the bottom of the viewport.

### Modified Capabilities
- `ui-routing-and-rbac`: Adding nested route paths for the workshop details screen (`/workshops/:id`) within the student domain.

## Impact

- `apps/web/src/pages/student/Home.tsx` (Major updates to implement list UI and clickable cards)
- `apps/web/src/components/workshop/WorkshopCard.tsx` (New component creation)
- `apps/web/src/components/workshop/DateRangeSelector.tsx` (New component creation)
- `apps/web/src/pages/student/WorkshopDetail.tsx` (New component creation)
- `apps/web/src/router/index.tsx` (Add detail route)
