# registration-qr-viewer Specification

## Purpose
TBD - created by archiving change my-registrations-screen. Update Purpose after archive.
## Requirements
### Requirement: QR code generation from qrStub
The system SHALL display a scannable QR code image generated from the `qrStub` string of a PAID registration. The QR code screen SHALL show the workshop title, date, and a back button to return to the registrations list.

#### Scenario: Display QR code for a confirmed ticket
- **GIVEN** the student has a PAID registration with `qrStub` value `"QR:abc123:1715900000000"`
- **WHEN** the student navigates to `/my-registrations/:id/qr`
- **THEN** a QR code image is rendered encoding the string `"QR:abc123:1715900000000"`
- **AND** the workshop title and date are displayed above the QR code
- **AND** a back button navigates to `/my-registrations`

#### Scenario: QR code with missing qrStub
- **GIVEN** the student has a PAID registration but `qrStub` is null (edge case)
- **WHEN** the student navigates to `/my-registrations/:id/qr`
- **THEN** a fallback message "QR code not available" is displayed
- **AND** the student can navigate back

### Requirement: QR code is scannable
The generated QR code SHALL be large enough to scan reliably on mobile devices (minimum 200x200 pixels) and SHALL use high contrast colors.

#### Scenario: QR code renders at scannable size
- **WHEN** the QR code screen is displayed
- **THEN** the QR code image is rendered at a minimum of 200x200 pixels
- **AND** uses dark foreground on light background for maximum contrast

