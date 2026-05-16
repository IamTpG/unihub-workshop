## MODIFIED Requirements

### Requirement: Workshop List View
The system SHALL display a dynamic list of workshops available for users to browse. The list MUST group workshops chronologically by day, and staff workshop selections MUST carry workshop context into the check-in scanner.

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

#### Scenario: Staff workshop card opens scan page with context
- **WHEN** staff clicks a workshop card in `/manage`
- **THEN** the system navigates to `/manage/scan`
- **AND** passes navigation state `{ workshopId, workshopTitle }`

#### Scenario: Asynchronous UI fallback states
- **WHEN** the UI system is actively fetching background datasets
- **THEN** system MUST render a centralized loading spinner aligned to global system themes
- **WHEN** network transport failures occur during fetch
- **THEN** system SHALL display a reconnection gate with error descriptors and a "Retry" trigger
- **WHEN** the data backend returns no valid records for the filter
- **THEN** system MUST render an illustrative empty state container
