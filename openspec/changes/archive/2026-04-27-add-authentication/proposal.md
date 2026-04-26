## Why

The backend currently uses a shared static API key (`x-api-key` header) for all requests, offering zero user identity, no role differentiation, and no session management. Every downstream feature — workshop registration, payment, QR ticketing, staff check-in — requires knowing *who* is making the request and *what role* they hold. Without proper authentication, the system cannot enforce RBAC, cannot issue per-user QR tickets, and cannot support the offline staff JWT workflow. This is the foundational blocker for all other domain modules.

## What Changes

- **New `auth` module** (`modules/auth/`) following the existing Route → Controller → Service → Repository layered pattern, providing:
  - `POST /api/v1/auth/login` — Accept username, generate OTP if user exists, and email it. Returns success regardless of user existence (anti-enumeration).
  - `POST /api/v1/auth/verify-otp` — Validate OTP, issue JWT access token + refresh token pair.
  - `POST /api/v1/auth/refresh` — Accept refresh token, rotate it, issue new access + refresh pair.
  - `POST /api/v1/auth/logout` — Revoke the refresh token family.
- **Prisma schema additions** — `User` model (with `role` enum: `STUDENT`, `ADMIN`, `STAFF`), `OtpToken` model, `RefreshToken` model. Map to snake_case column names per spec.
- **Maintain `checkApiKey` middleware** as a global gateway layer for all API requests.
- **Add `authenticate` middleware** (JWT-based) as a second layer to verify user identity and populate `req.user`.
- **New `authorize` middleware** for role-based route guarding.
- **Environment config expansion** — Add `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL` (15m), `JWT_REFRESH_TTL` (7d), `OTP_TTL` (10m), `OTP_LENGTH` (6) to the Zod-validated `env.ts`.
- **Refresh token rotation with family-based revocation** — As defined in spec.
- **Redis-based rate limiting** — 5 verification attempts per 10 minutes per username.

## Capabilities

### New Capabilities
- `otp-login`: OTP-based passwordless authentication flow (request OTP → verify OTP → receive JWT pair).
- `jwt-session`: JWT access/refresh token lifecycle management (issuance, rotation, revocation, family-based security).
- `rbac-middleware`: Role-based access control middleware for protecting routes by user role.

### Modified Capabilities
_(No existing specs to modify — this is a greenfield auth system replacing a static API key.)_

## Impact

- **`core/middlewares/auth.middleware.ts`** — Current `checkApiKey` will be replaced by `authenticate` (JWT verify) and `authorize` (role check).
- **`config/env.ts`** — Expanded with JWT secrets, TTLs, OTP config.
- **`prisma/schema.prisma`** — New `User`, `OtpToken`, `RefreshToken` models with the `Role` enum.
- **`app.ts`** — Swap `checkApiKey` import for the new `authenticate` middleware. Public routes (OTP request/verify) will be excluded from auth.
- **`types/express.d.ts`** — Extend `Request` to include `req.user` with `{ id, role }`.
- **Dependencies** — `jsonwebtoken`, `bcryptjs`, `@types/jsonwebtoken`, `@types/bcryptjs` (already in project tech stack plan).
- **All future module routes** — Will depend on `authenticate` + `authorize` middleware for access control.
