## Requirements

### Requirement: Workspace root layout

Repository SHALL expose the top-level workspace layout `apps/`, `packages/`, `data/`, `docs/`, and `openspec/`.

#### Scenario: Required root folders exist

- **GIVEN** the refactor has been applied
- **WHEN** a developer lists the repository root
- **THEN** the repository contains `apps/`, `packages/`, `data/`, `docs/`, and `openspec/`

#### Scenario: Legacy backend root removed

- **GIVEN** the backend has been moved
- **WHEN** a developer lists the repository root
- **THEN** `unihub-backend/` is no longer the active backend package path

### Requirement: Application workspace layout

Repository SHALL contain application folders `apps/web/`, `apps/api/`, and `apps/worker/`.

#### Scenario: API application owns backend runtime

- **GIVEN** the refactor has been applied
- **WHEN** a developer opens `apps/api/`
- **THEN** it contains the backend package files, source entry points, runtime config, and build scripts needed to run the existing Express API

#### Scenario: Web and worker placeholders are explicit

- **GIVEN** web implementation is out of scope
- **WHEN** a developer opens `apps/web/`
- **THEN** the folder exists with a minimal placeholder or README that makes clear it is reserved for a later implementation

#### Scenario: Worker application owns background processors

- **GIVEN** the refactor has been applied
- **WHEN** a developer opens `apps/worker/src/`
- **THEN** it contains `processors/`, `queue.ts`, and `main.ts`

### Requirement: Shared package layout

Repository SHALL contain shared package folders `packages/db/`, `packages/shared/`, and `packages/config/`.

#### Scenario: Database package contains Prisma assets and client

- **GIVEN** the refactor has been applied
- **WHEN** a developer opens `packages/db/`
- **THEN** Prisma schema and seed assets are located under `packages/db/prisma/` and Prisma singleton export is located at `packages/db/src/index.ts`

#### Scenario: Shared package subfolders exist

- **GIVEN** the refactor has been applied
- **WHEN** a developer opens `packages/shared/`
- **THEN** it contains `src/types/`, `src/constants/`, and `src/validation/`

#### Scenario: Config package is reserved

- **GIVEN** shared config implementation is out of scope
- **WHEN** a developer opens `packages/config/`
- **THEN** the folder exists with a minimal placeholder and no fake production API

### Requirement: API source boundaries

API source code SHALL organize domain modules, infrastructure adapters, middleware, and route composition under `apps/api/src/`.

#### Scenario: API boundary folders exist

- **GIVEN** the refactor has been applied
- **WHEN** a developer lists `apps/api/src/`
- **THEN** it contains `modules/`, `infra/`, `middleware/`, and `routes/`

#### Scenario: Existing auth behavior is preserved

- **GIVEN** existing auth code has been moved into the new API layout
- **WHEN** API auth routes and middleware are invoked through the same public endpoints as before
- **THEN** JWT session, OTP login, and RBAC behavior remain unchanged except for internal file paths

### Requirement: API domain module folders

API source SHALL provide module folders for the planned UniHub domains.

#### Scenario: Planned module folders exist

- **GIVEN** the refactor has been applied
- **WHEN** a developer lists `apps/api/src/modules/`
- **THEN** it contains `auth`, `users`, `workshops`, `registrations`, `payments`, `checkins`, `notifications`, `student-import`, `ai-summary`, `admin`, and `reporting`

#### Scenario: Unimplemented modules do not expose fake endpoints

- **GIVEN** a planned module has no feature implementation yet
- **WHEN** the API route registry is loaded
- **THEN** the module does not register placeholder endpoints that imply completed behavior

### Requirement: API infrastructure folders

API source SHALL provide infrastructure folders for external systems and resilience concerns.

#### Scenario: Planned infrastructure folders exist

- **GIVEN** the refactor has been applied
- **WHEN** a developer lists `apps/api/src/infra/`
- **THEN** it contains `db`, `redis`, `queue`, `mail`, `payment`, `ai`, `storage`, `auth`, `rate-limit`, `idempotency`, and `circuit-breaker`

#### Scenario: Infrastructure failure remains isolated

- **GIVEN** an optional infrastructure adapter such as mail, queue, payment, AI, or storage is not configured
- **WHEN** the API starts in a development/demo environment
- **THEN** existing implemented features fail gracefully or stay disabled without preventing unrelated auth/API flows from loading

### Requirement: Developer commands remain usable

Repository SHALL update scripts and tool configuration so developers can run the API from the new location.

#### Scenario: API development command uses new path

- **GIVEN** the refactor has been applied
- **WHEN** a developer runs the documented API development command from the repository root
- **THEN** it starts `apps/api/src/server.ts` or the equivalent API entry point

#### Scenario: API build validates moved imports

- **GIVEN** the refactor has been applied
- **WHEN** a developer runs the documented API build command
- **THEN** TypeScript compiles without stale references to `unihub-backend/`

#### Scenario: Stale path references are rejected

- **GIVEN** code, package scripts, or docs still reference the old active backend path
- **WHEN** verification searches for `unihub-backend`
- **THEN** any remaining reference is either removed, updated, or explicitly documented as historical text
