## ADDED Requirements

### Requirement: PaymentProvider interface defines the payment contract
The system SHALL define a `PaymentProvider` interface in `packages/shared` with three methods: `createIntent`, `verifyWebhook`, and `refund`. All payment integrations SHALL implement this interface.

#### Scenario: Interface is implemented by a concrete provider
- **WHEN** a new payment provider class is created
- **THEN** it MUST implement `createIntent`, `verifyWebhook`, and `refund` or TypeScript compilation SHALL fail

### Requirement: createIntent creates a payment intent
`PaymentProvider.createIntent` SHALL accept `amount` (number), `currency` (string), and `metadata` (object), and return `{ intentId: string, clientSecret: string }`.

#### Scenario: Successful intent creation
- **WHEN** `createIntent` is called with valid parameters
- **THEN** it returns an object with a non-empty `intentId` and `clientSecret`

#### Scenario: Intent creation failure
- **WHEN** `createIntent` encounters an error (network failure, provider rejection)
- **THEN** it throws an error with a descriptive message

### Requirement: verifyWebhook validates provider webhook signatures
`PaymentProvider.verifyWebhook` SHALL accept `payload` (Buffer or string), `signature` (string), and `providerSecret` (string), and return `{ eventType: string, intentId: string, eventId: string }`.

#### Scenario: Valid signature
- **WHEN** `verifyWebhook` is called with a matching payload and signature
- **THEN** it returns the parsed event object with `eventType`, `intentId`, and `eventId`

#### Scenario: Invalid signature
- **WHEN** `verifyWebhook` is called with a mismatched signature
- **THEN** it throws an error indicating signature verification failure

### Requirement: refund issues a refund for a payment intent
`PaymentProvider.refund` SHALL accept `intentId` (string) and `amount` (number), and return `{ refundId: string }`.

#### Scenario: Successful refund
- **WHEN** `refund` is called with a valid `intentId` and amount
- **THEN** it returns `{ refundId }` confirming the refund

### Requirement: MockPaymentProvider implements the interface for local testing
A `MockPaymentProvider` class SHALL implement `PaymentProvider`, using deterministic in-memory behavior. It SHALL be the default provider when `NODE_ENV !== 'production'`.

#### Scenario: Mock createIntent
- **WHEN** `MockPaymentProvider.createIntent` is called
- **THEN** it returns a predictable `{ intentId: "mock_intent_<uuid>", clientSecret: "mock_secret" }` without making any external HTTP call

#### Scenario: Mock verifyWebhook always succeeds for valid test payloads
- **WHEN** `MockPaymentProvider.verifyWebhook` is called with a test payload containing `eventType` and `intentId`
- **THEN** it parses the payload as JSON and returns the event fields directly (no signature check in mock)

#### Scenario: Mock refund
- **WHEN** `MockPaymentProvider.refund` is called
- **THEN** it returns `{ refundId: "mock_refund_<uuid>" }` without any external call
