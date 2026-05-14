# UniHub Workshop Architecture

UniHub Workshop uses a lightweight monorepo layout with a modular Express API and reserved spaces for the responsive web app, background workers, shared packages, data, and documentation.

## Workspace Layout

```text
unihub-workshop/
  apps/
    web/      # Reserved for the responsive web app
    api/      # Express API runtime
    worker/   # BullMQ background processors
  packages/
    db/
      prisma/ # Prisma schema and seed assets
      src/    # Prisma singleton package (@unihub/db)
    shared/
      src/
        types/
        constants/
        validation/
    config/   # Reserved for shared config/tooling
  data/       # Reserved for demo/import data
  docs/
  openspec/
```

## API Layout

```text
apps/api/src/
  app.ts
  server.ts
  modules/
  infra/
  middleware/
  routes/
  types/
  workers/
```

`modules/` contains domain code. Implemented modules follow the existing route/controller/service/repository/schema pattern.

`infra/` contains adapters for external systems and cross-cutting infrastructure concerns such as database, Redis, queue, mail, payment, AI, storage, auth helpers, rate limiting, idempotency, and circuit breakers.

`middleware/` contains Express middleware shared by routes.

`routes/` composes public and protected route registrations for the API.

## Current Runtime

The active runtime is `apps/api`. Existing auth behavior is preserved while internal paths have moved:

- API entry point: `apps/api/src/server.ts`
- Express app setup: `apps/api/src/app.ts`
- Prisma schema and seed: `packages/db/prisma/`
- API dev command from root: `npm run dev:api`
- API build command from root: `npm run build:api`
- API lint command from root: `npm run lint:api`

`apps/web` and `packages/config` are placeholders in this change and do not expose production behavior yet.

The worker app owns BullMQ processors. The API only enqueues jobs; background processing starts from `apps/worker/src/main.ts`.
