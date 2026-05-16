## MODIFIED Requirements

### Requirement: Workshop Details View
The system SHALL display intensive details for a specific workshop, providing hierarchical metadata cards and a focused registration gateway. The CTA button SHALL reflect the current registration window state using `registrationOpenAt` and `registrationCloseAt` from the workshop data. The frontend workshop type SHALL include `registrationOpenAt: string | null` and `registrationCloseAt: string | null`.

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

#### Scenario: CTA button shows normal register when no window is set
- **WHEN** viewing workshop details where both `registrationOpenAt` and `registrationCloseAt` are null
- **THEN** the CTA button is enabled
- **AND** the button text reflects the normal registration label (e.g., "Register • Free" or "Register • $25.00")

#### Scenario: CTA button shows normal register when within window
- **WHEN** viewing workshop details where the current time is after `registrationOpenAt` and before `registrationCloseAt`
- **THEN** the CTA button is enabled
- **AND** the button text reflects the normal registration label

#### Scenario: CTA button is disabled with future open time
- **WHEN** viewing workshop details where `registrationOpenAt` is set and the current time is before `registrationOpenAt`
- **THEN** the CTA button is disabled
- **AND** the button text is "Opens [formatted registrationOpenAt date]"

#### Scenario: CTA button is disabled after close time
- **WHEN** viewing workshop details where `registrationCloseAt` is set and the current time is after `registrationCloseAt`
- **THEN** the CTA button is disabled
- **AND** the button text is "Registration Closed"

#### Scenario: CTA button is enabled when only open time is past
- **WHEN** viewing workshop details where `registrationOpenAt` is set, current time is after `registrationOpenAt`, and `registrationCloseAt` is null
- **THEN** the CTA button is enabled
- **AND** the button text reflects the normal registration label
