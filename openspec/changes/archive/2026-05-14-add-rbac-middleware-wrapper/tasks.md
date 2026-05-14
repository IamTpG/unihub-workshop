## 1. Middleware Implementation

- [x] 1.1 Developer A: Add `apps/api/src/middleware/rbac.middleware.ts` exporting `requireRoles(allowedRoles: Role[])`.
- [x] 1.2 Developer A: In `requireRoles`, return `UnauthorizedError("Authentication required")` when `req.user` is missing.
- [x] 1.3 Developer A: In `requireRoles`, return `ForbiddenError("Insufficient permissions")` when `req.user.role` is not included in `allowedRoles`.
- [x] 1.4 Developer A: Ensure `requireRoles` performs only in-memory role checks and makes no DB, Redis, queue, mail, or network calls.

## 2. Integration Cleanup

- [x] 2.1 Developer B: Search for existing `authorize(` usage and update route imports/usages to `requireRoles([...])` if any exist.
- [x] 2.2 Developer B: Remove RBAC ownership from `auth.middleware.ts` or leave a compatibility export only if needed by existing imports.
- [x] 2.3 Developer B: Confirm Express `req.user.role` typing still uses the `Role` type from `@unihub/db`.

## 3. Verification

- [x] 3.1 Developer A: Run `npm run lint:api` and fix any lint/type issues.
- [x] 3.2 Developer A: Run `npm run build:api` and fix any TypeScript compile issues.
- [x] 3.3 Developer B: Verify `apps/api/src/middleware/rbac.middleware.ts` exists and exports `requireRoles`.
- [x] 3.4 Developer B: Run `openspec status --change add-rbac-middleware-wrapper` and confirm the change remains apply-ready.
