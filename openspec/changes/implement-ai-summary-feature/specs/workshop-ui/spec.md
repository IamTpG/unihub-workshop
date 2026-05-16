## MODIFIED Requirements

### Requirement: Workshop Details View
The system SHALL display intensive details for a specific workshop, providing hierarchical metadata cards, AI summary state, and a focused registration gateway.

#### Scenario: Fluid Navigation and Hydration
- **WHEN** user executes a click event on a Workshop Card
- **THEN** system performs dynamic routing to `/workshops/:id`
- **THEN** system checks client-side store caches to instantly hydrate the UI
- **THEN** if store cache misses, system MUST dispatch a background API hydration call gracefully

#### Scenario: Premium Atomic Card Presentation
- **WHEN** rendering the details layout
- **THEN** system MUST render an atomic "Presenter Profile Card" mapping speaker details
- **THEN** system MUST render an atomic "Location Card" mapping capacity and room info
- **THEN** system MUST render a fixed header providing intuitive "Back" navigation controls

#### Scenario: AI summary is available
- **WHEN** rendering workshop details for a workshop with `aiSummary`
- **THEN** system MUST render an atomic "Session Summary Card" with the summary text

#### Scenario: AI summary is processing
- **WHEN** rendering workshop details for a workshop with PDF presence state and no `aiSummary`
- **THEN** system MUST render a "Summary processing..." placeholder

#### Scenario: AI summary is absent
- **WHEN** rendering workshop details for a workshop with no PDF presence state and no `aiSummary`
- **THEN** system MUST NOT render the summary card

#### Scenario: Bottom Action CTA Architecture
- **WHEN** viewing details
- **THEN** system MUST render a sticky bottom-screen call-to-action button anchored in accent aesthetics
- **THEN** action text MUST dynamically embed the currency tag (e.g., "Register - Free" or "Register - $25.00")
