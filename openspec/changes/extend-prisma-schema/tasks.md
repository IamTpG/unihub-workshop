## 1. Update Prisma Schema

- [x] 1.1 Add `registrationOpenAt` and `registrationCloseAt` optional fields to the `Workshop` model in `packages/db/prisma/schema.prisma`
- [x] 1.2 Add `CANCELLED` value to the `RegStatus` enum in `packages/db/prisma/schema.prisma`
- [x] 1.3 Add `Notification` model (with `User` relation and cascade delete) to `packages/db/prisma/schema.prisma`
- [x] 1.4 Add `StudentRecord` model to `packages/db/prisma/schema.prisma`
- [x] 1.5 Add `notifications` relation field to the `User` model in `packages/db/prisma/schema.prisma`
- [x] 1.6 Add `ImportLog` model to `packages/db/prisma/schema.prisma`

## 2. Generate and Validate Migration

- [x] 2.1 Run `pnpm --filter @unihub/db migrate:dev --name extend-schema` to generate the migration SQL and apply it to the dev database
- [x] 2.2 Verify the generated SQL file in `packages/db/prisma/migrations/` contains the expected `ALTER TABLE`, `CREATE TABLE`, and `ALTER TYPE` statements
- [x] 2.3 Confirm Prisma Client regenerates without errors (check for type errors in any existing code that imports from `@unihub/db`)

## 3. Update Package Exports

- [x] 3.1 Export `Notification`, `StudentRecord`, and `ImportLog` Prisma types from `packages/db/src/index.ts`
- [x] 3.2 Verify the build (`pnpm --filter @unihub/db build`) passes with no TypeScript errors
