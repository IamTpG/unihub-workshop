## Context

The API already authenticates JWT access tokens in `apps/api/src/middleware/auth.middleware.ts` and stores `{ id, role }` on `req.user`. That same file currently also contains an `authorize(...roles)` helper, which mixes authentication and authorization concerns and makes RBAC harder to find when adding new feature modules.

This change introduces a dedicated RBAC middleware file while preserving the existing authentication flow and Express request typing.

## Goals / Non-Goals

**Goals:**

- Add `apps/api/src/middleware/rbac.middleware.ts`.
- Provide `requireRoles(allowedRoles)` where `allowedRoles` is a `Role[]` from `@unihub/db`.
- Read `req.user.role` populated by `authenticate`.
- Return `401 Unauthorized` when `req.user` is missing.
- Return `403 Forbidden` when the role is not allowed.
- Keep authorization CPU-only with no DB, Redis, or external calls.

**Non-Goals:**

- No role hierarchy, permission matrix, or database-backed authorization.
- No JWT payload changes.
- No change to login, OTP, refresh token, or API key middleware behavior.
- No broad route adoption unless needed to keep imports consistent.

## Decisions

### Decision 1: Use a dedicated RBAC middleware file

`requireRoles` will live in `apps/api/src/middleware/rbac.middleware.ts`, keeping authorization separate from `auth.middleware.ts`.

Alternative considered: keep `authorize` inside `auth.middleware.ts`. That works technically, but it makes authorization harder to discover and increases coupling between auth verification and route authorization.

### Decision 2: Accept an array of roles

The middleware API will be `requireRoles(allowedRoles: Role[])`, matching the requested usage and making route code explicit: `requireRoles(["ADMIN", "STAFF"])`.

Alternative considered: variadic `authorize(...roles)`. The current helper uses this style, but the requested wrapper explicitly asks for an allowed-role array.

### Decision 3: Fail through existing error middleware

Missing authentication will call `next(new UnauthorizedError("Authentication required"))`. Forbidden roles will call `next(new ForbiddenError("Insufficient permissions"))`. This preserves the API's existing error response shape.

Alternative considered: return `res.status(403).json(...)` directly. Direct responses would bypass the shared response/error wrapper and risk inconsistent error payloads.

## Risks / Trade-offs

- [Risk] A route uses RBAC before `authenticate` -> Mitigation: return `401 Unauthorized` with "Authentication required" so the failure mode is clear.
- [Risk] Existing imports still reference `authorize` from `auth.middleware.ts` -> Mitigation: either keep a compatibility export or update imports to `requireRoles`.
- [Risk] Empty allowed role array denies every authenticated user -> Mitigation: treat the empty array as a valid explicit deny-all configuration and cover it with a test or verification case.

## Migration Plan

1. Add `apps/api/src/middleware/rbac.middleware.ts`.
2. Move or duplicate the role-checking logic into `requireRoles(allowedRoles: Role[])`.
3. Update `auth.middleware.ts` to stop owning RBAC logic or re-export a compatibility wrapper only if needed.
4. Search for `authorize(` imports and update route usage to `requireRoles([...])` when present.
5. Run `npm run lint:api` and `npm run build:api`.

## Open Questions

None.
