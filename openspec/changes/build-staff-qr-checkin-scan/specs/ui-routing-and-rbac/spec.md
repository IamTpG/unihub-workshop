## ADDED Requirements

### Requirement: Staff scan route renders scanner page
The system SHALL render the staff QR scanner page at `/manage/scan` inside the staff mobile route branch.

#### Scenario: Staff opens scan route
- **GIVEN** a logged-in user with the `STAFF` role
- **WHEN** the user navigates to `/manage/scan`
- **THEN** the page renders inside `MobileShell`
- **AND** the scanner page component is shown instead of a placeholder

#### Scenario: Student cannot open scan route
- **GIVEN** a logged-in user with the `STUDENT` role
- **WHEN** the user attempts to navigate to `/manage/scan`
- **THEN** route protection prevents access to the staff scanner route
