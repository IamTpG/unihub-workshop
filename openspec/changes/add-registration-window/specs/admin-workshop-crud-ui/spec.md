## ADDED Requirements

### Requirement: Admin create form includes Registration Window section
The workshop create form at `/admin/workshops/new` SHALL include an optional "Registration Window" section with two `datetime-local` inputs: `registrationOpenAt` and `registrationCloseAt`. Both inputs SHALL be optional. The section SHALL display the note "Leave blank to allow registration at any time".

#### Scenario: Create form renders Registration Window section
- **GIVEN** an authenticated admin user
- **WHEN** the admin navigates to `/admin/workshops/new`
- **THEN** the form includes a labeled "Registration Window" section
- **AND** the section contains a `datetime-local` input for `registrationOpenAt`
- **AND** the section contains a `datetime-local` input for `registrationCloseAt`
- **AND** the section displays the note "Leave blank to allow registration at any time"

#### Scenario: Create form submits window fields when filled
- **GIVEN** an admin has entered values for both `registrationOpenAt` and `registrationCloseAt`
- **WHEN** the admin submits the create form
- **THEN** the request payload includes both ISO 8601 datetime strings

#### Scenario: Create form omits window fields when blank
- **GIVEN** an admin leaves both `registrationOpenAt` and `registrationCloseAt` blank
- **WHEN** the admin submits the create form
- **THEN** the request payload omits both fields or sends them as null

#### Scenario: Create form rejects open after close client-side
- **GIVEN** an admin enters a `registrationOpenAt` that is equal to or after `registrationCloseAt`
- **WHEN** the admin attempts to submit the create form
- **THEN** the system prevents submission
- **AND** displays a validation message indicating registrationOpenAt must be before registrationCloseAt

### Requirement: Admin edit form includes Registration Window section
The workshop edit form at `/admin/workshops/:id/edit` SHALL include the same "Registration Window" section as the create form. Both window fields SHALL be pre-populated when the existing workshop has window values set.

#### Scenario: Edit form pre-populates Registration Window when set
- **GIVEN** an authenticated admin navigates to an edit form for a workshop that has `registrationOpenAt` and `registrationCloseAt` set
- **WHEN** the form loads
- **THEN** the `registrationOpenAt` input is pre-populated with the existing value formatted for `datetime-local`
- **AND** the `registrationCloseAt` input is pre-populated with the existing value formatted for `datetime-local`

#### Scenario: Edit form shows empty Registration Window when not set
- **GIVEN** an authenticated admin navigates to an edit form for a workshop with no registration window
- **WHEN** the form loads
- **THEN** both `registrationOpenAt` and `registrationCloseAt` inputs are empty

#### Scenario: Edit form clears window when inputs are blanked
- **GIVEN** an admin clears both `registrationOpenAt` and `registrationCloseAt` inputs in the edit form
- **WHEN** the admin submits the edit form
- **THEN** the request payload sends null (or omits) both window fields
- **AND** the server clears the window timestamps on the workshop record

#### Scenario: Edit form rejects open after close client-side
- **GIVEN** an admin enters a `registrationOpenAt` that is equal to or after `registrationCloseAt` in the edit form
- **WHEN** the admin attempts to submit the edit form
- **THEN** the system prevents submission
- **AND** displays a validation message indicating registrationOpenAt must be before registrationCloseAt
