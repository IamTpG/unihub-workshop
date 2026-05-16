## MODIFIED Requirements

### Requirement: Batch check-in endpoint for offline sync
The system SHALL provide a batch endpoint for staff to sync multiple offline check-ins in a single request.

#### Scenario: Successful batch check-in
- **WHEN** a staff user sends a batch of check-in records shaped as `{ items: Array<{ registrationId: string, checkedInAt?: string }> }`
- **AND** all registrations are valid and eligible
- **THEN** all eligible registrations are updated within a single database transaction
- **AND** the response includes `processedCount`, `skippedCount`, `syncedIds`, and `failedIds`
- **AND** `syncedIds` includes registration IDs whose desired checked-in state is satisfied

#### Scenario: Already checked-in item is idempotent
- **WHEN** a staff user sends a batch item for a registration that is already checked in
- **THEN** the system does not overwrite the existing `checkedInAt` value
- **AND** the registration ID is included in `syncedIds`
- **AND** the item is not treated as a failed sync

#### Scenario: Invalid batch item is reported
- **WHEN** a staff user sends a batch item for an invalid or ineligible registration
- **THEN** the system includes that registration ID in `failedIds`
- **AND** valid items in the same batch can still be processed

#### Scenario: Batch size limit
- **WHEN** a staff user sends a batch exceeding the maximum allowed size (e.g., 100 records)
- **THEN** the system returns a validation error
