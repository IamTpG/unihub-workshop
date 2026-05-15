## Context

Students need a fully immersive mobile interface to discover scheduled workshops and view in-depth details before making a registration decision. The `/workshops` route must serve as the primary entry point, showing a dynamic list of workshops grouped by date. We have a robust `useWorkshopStore` fetching live workshop structures containing rich properties (presenter, capacity, description, pricing) which power both the list view and the drill-down detail view.

## Goals / Non-Goals

**Goals:**
- Design a modular, responsive `StudentHome.tsx` and `WorkshopDetail.tsx` mapping to the provided mockups.
- Extract reusable atomic components (`WorkshopCard`, `DateRangeSelector`) to keep layouts clean.
- Integrate the detail view into the React Router tree at `/workshops/:id`.
- Support seamless loading states using cached workshop list data before falling back to full network hydration.
- Render dynamic seats availability and pricing using standard theme colors natively (`var(--bg)`, `var(--accent)`).

**Non-Goals:**
- Implementing Stripe or complex payment processing workflows.
- Real-time WebSockets to subscribe to seat availability.

## Decisions

**1. Data Loading Strategy**
- **Approach**: When navigating to `/workshops/:id`, we will attempt to pull the workshop object directly from the existing `useWorkshopStore` cache. If not found (e.g. direct URL hit), we will trigger `fetchWorkshops` to hydrate the store.
- **Why**: Avoids creating duplicate detail-fetching endpoints/state logic when the list endpoint already provides comprehensive information for MVP demoability.

**2. Component Layout & Styling**
- **Approach**: Extract `WorkshopCard` and `DateRangeSelector` to `apps/web/src/components/workshop/`. Implement the main pages (`Home.tsx`, `WorkshopDetail.tsx`) natively using standard CSS variable hooks.
- **Why**: Keeps page components clean and ensures all screens natively respect the app's iOS-inspired premium aesthetic while supporting instant Light/Dark mode toggling.

## Risks / Trade-offs

- **[Risk: Direct URL Hits]** Users navigating straight to `/workshops/123` before the store has hydrated will see a blank or error screen.
  - **Mitigation**: Introduce a local loading spinner block in `WorkshopDetail.tsx` that evaluates `useWorkshopStore.isLoading` and halts render until hydration is complete.
