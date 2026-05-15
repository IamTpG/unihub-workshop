## ADDED Requirements

### Requirement: Workshop details view
The system SHALL display detailed information about a specific workshop, including presenter, full description, capacity, available seats, pricing, and an action button for registration.

#### Scenario: View workshop details from workshops list
- **WHEN** user clicks on a workshop card in the workshops list
- **THEN** system navigates to the detailed workshop view (`/workshops/:id`)
- **THEN** system attempts to load the workshop data from the in-memory store
- **THEN** system renders the presenter name, capacity, assigned room, detailed summary, and pricing

#### Scenario: Direct navigation to details page
- **WHEN** user navigates directly to a workshop details URL without prior cache
- **THEN** system triggers a network fetch to hydrate the store before rendering the data

#### Scenario: Invalid workshop ID
- **WHEN** user requests a workshop ID that does not exist
- **THEN** system displays an error boundary indicating the workshop could not be found
