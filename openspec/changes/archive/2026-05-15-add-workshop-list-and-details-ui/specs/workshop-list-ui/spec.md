## ADDED Requirements

### Requirement: Workshop List View
The system SHALL display a dynamic list of workshops available for students to browse and register for. The list MUST group workshops chronologically by day.

#### Scenario: View workshops on explore screen
- **WHEN** user navigates to `/workshops`
- **THEN** system fetches the list of active workshops from the data store
- **THEN** system renders a Date Range selector at the top
- **THEN** system groups workshops by date (e.g., "Sun, May 24")
- **THEN** system renders interactive Workshop Cards for each event

#### Scenario: View workshop card details
- **WHEN** system renders a Workshop Card
- **THEN** card MUST display the start time, remaining seats badge, title, presenter name, and pricing badge
- **THEN** pricing badge MUST be styled differently for Paid vs Free events
- **THEN** seats badge MUST be styled dynamically (red if full, green if available)

#### Scenario: Empty state
- **WHEN** the store returns an empty array of workshops
- **THEN** system displays a friendly empty state message indicating no workshops are found

#### Scenario: Loading state
- **WHEN** the system is actively fetching data
- **THEN** system displays a centralized loading spinner
