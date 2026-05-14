## Why

RBAC is already part of the API security model, but the authorization helper currently lives inside the authentication middleware file. A dedicated RBAC middleware makes protected route intent clearer for course review, keeps auth and authorization responsibilities separate, and gives future modules a simple reusable guard.

## What Changes

- Add `apps/api/src/middleware/rbac.middleware.ts` as the dedicated RBAC middleware module.
- Provide `requireRoles(allowedRoles)` that accepts an array of `Role` enum values: `STUDENT`, `ADMIN`, and `STAFF`.
- Have the middleware read `req.user.role`, assuming `authenticate` has already populated `req.user`.
- Return `401 Unauthorized` when RBAC is used before authentication and `req.user` is missing.
- Return `403 Forbidden` when the authenticated user's role is not in the allowed roles array.
- Keep the existing auth middleware behavior and public auth routes stable.

Non-goals:

- No database lookups for authorization.
- No new role hierarchy or permission table.
- No changes to JWT token structure, login, OTP, or refresh-token behavior.
- No route-level adoption beyond providing the reusable middleware unless a route already needs it during implementation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `rbac-middleware`: Clarify and standardize role-based authorization as a dedicated `requireRoles(allowedRoles)` middleware wrapper.

## Impact

- Affected code: API middleware, imports that currently use `authorize`, and TypeScript role imports from `@unihub/db`.
- Affected APIs: no public HTTP contract changes; only authorization guard internals and route middleware usage change.
- Dependencies: no new runtime dependency.
- Course/demo value: RBAC becomes visible, reusable, and easier to demonstrate across admin/staff/student-only endpoints.
