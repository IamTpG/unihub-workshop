# Workshop User Interface Specification

## Purpose
This specification defines the front-end presentation, interaction, state management, and routing behaviors for the mobile-first workshop listing portals and detailed inspection views consumed by students and staff users.

## Requirements

### Requirement: Workshop List View
The system SHALL display a dynamic list of workshops available for users to browse. The list MUST group workshops chronologically by day.

#### Scenario: View workshops on active home screen
- **WHEN** user navigates to `/workshops` (Student) or `/manage` (Staff Check-In Desk)
- **THEN** system fetches the list of active workshops from the data store
- **THEN** system renders interactive, dynamic Workshop Cards for each scheduled event
- **THEN** system groups the array chronologically by day (e.g., "Sun, May 24")

#### Scenario: Student exploration weekly filtration boundaries
- **WHEN** a Student user views their main explore portal
- **THEN** system MUST render a Date Range selector snapped precisely from Monday to Sunday
- **THEN** system SHALL filter active items to match the bound start time of that target week
- **THEN** system MUST default to the current active calendar week upon initial load

#### Scenario: Interactive Unified Workshop Cards
- **WHEN** rendering a shared Workshop Card (Student or Staff queues)
- **THEN** card MUST render the event start time, room location, session title, and speaker name
- **THEN** card MUST display current seat booking fraction (e.g., `${capacity - availableSlots}/${capacity} seats`)
- **THEN** card MUST trigger corresponding route navigation upon click activation

#### Scenario: Asynchronous UI fallback states
- **WHEN** the UI system is actively fetching background datasets
- **THEN** system MUST render a centralized loading spinner aligned to global system themes
- **WHEN** network transport failures occur during fetch
- **THEN** system SHALL display a reconnection gate with error descriptors and a "Retry" trigger
- **WHEN** the data backend returns no valid records for the filter
- **THEN** system MUST render an illustrative empty state container

### Requirement: Workshop Details View
The system SHALL display intensive details for a specific workshop, providing hierarchical metadata cards and a focused registration gateway.

#### Scenario: Fluid Navigation and Hydration
- **WHEN** user executes a click event on a Workshop Card
- **THEN** system performs dynamic routing to `/workshops/:id`
- **THEN** system checks client-side store caches to instantly hydrate the UI
- **THEN** if store cache misses, system MUST dispatch a background API hydration call gracefully

#### Scenario: Premium Atomic Card Presentation
- **WHEN** rendering the details layout
- **THEN** system MUST render an atomic "Presenter Profile Card" mapping speaker details
- **THEN** system MUST render an atomic "Session Summary Card" mapping AI content descriptors
- **THEN** system MUST render an atomic "Location Card" mapping capacity and room info
- **THEN** system MUST render a fixed header providing intuitive "Back" navigation controls

#### Scenario: Bottom Action CTA Architecture
- **WHEN** viewing details
- **THEN** system MUST render a sticky bottom-screen call-to-action button anchored in accent aesthetics
- **THEN** action text MUST dynamically embed the currency tag (e.g., "Register • Free" or "Register • $25.00")
