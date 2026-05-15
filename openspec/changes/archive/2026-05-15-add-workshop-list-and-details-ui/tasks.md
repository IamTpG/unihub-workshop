## 0. Workshop List Extraction & Componentization

- [x] 0.1 Extract `WorkshopCard` component to encapsulate dynamic badging and card layout.
- [x] 0.2 Extract `DateRangeSelector` component to modularize header controls.
- [x] 0.3 Refactor `StudentHome.tsx` to map grouped workshop data over the new atomic components.

## 1. Routing Setup

- [x] 1.1 Add `/workshops/:id` route to `apps/web/src/router/index.tsx` as a child of the `MobileShell` layout.
- [x] 1.2 Implement click handlers on workshop cards in `StudentHome.tsx` to navigate to the new detail route.

## 2. Details Component Scaffold

- [x] 2.1 Create `apps/web/src/pages/student/WorkshopDetail.tsx`.
- [x] 2.2 Wire up React Router's `useParams` to extract the workshop ID from the URL.
- [x] 2.3 Connect the component to `useWorkshopStore` and implement initial cache-check logic.
- [x] 2.4 Implement network hydration fallback (trigger `fetchWorkshops` if ID is not in state).
- [x] 2.5 Add graceful loading spinners and error states matching the global theme.

## 3. UI Implementation (Premium Dynamic Layout)

- [x] 3.1 Implement the top header block (Title, Date, Time ranges, dynamic Seats and Price badges).
- [x] 3.2 Implement the "Presenter" nested card section mapping the `speakerName` property.
- [x] 3.3 Implement the "Summary" nested card section mapping the `aiSummary` property.
- [x] 3.4 Implement the "Assigned Room" section mapping `location` and `capacity` metadata.
- [x] 3.5 Create the sticky, full-width bottom "Register" action button (`var(--accent)`) that dynamically renders the workshop price or "Free".
