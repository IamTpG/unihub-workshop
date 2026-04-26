## 1. Dependencies & Environment Config

- [x] 1.1 Install `jsonwebtoken`, `bcryptjs`, `@types/jsonwebtoken`, `@types/bcryptjs` as project dependencies
- [x] 1.2 Add `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL` (15m), `JWT_REFRESH_TTL` (7d), `OTP_TTL` (10m), `OTP_LENGTH` (6), `OTP_MAX_ATTEMPTS` (5 per 10m) to `config/env.ts`
- [x] 1.3 Update `.env.example` with the new environment variables and sample values

## 2. Prisma Schema & Migration

- [x] 2.1 Add `Role` enum (`STUDENT`, `ADMIN`, `STAFF`) to `prisma/schema.prisma`
- [x] 2.2 Add `User` model with fields: `id` (UUID), `username` (unique), `fullName`, `email`, `role` (Role enum), `createdAt`, `updatedAt`
- [x] 2.3 Add `OtpToken` model with fields: `id` (UUID), `user_id` (FK → User), `hashed_code`, `expires_at`, `is_used` (boolean, default false), `createdAt`. Use `@map` for snake_case.
- [x] 2.4 Add `RefreshToken` model with fields: `id` (UUID), `user_id` (FK → User), `token_hash`, `family_id` (UUID), `is_revoked` (default false), `expires_at`, `createdAt`. Use `@map` for snake_case.
- [x] 2.5 Run `npx prisma migrate dev` to generate and apply the migration

## 3. Auth Module Structure

- [x] 3.1 Create `modules/auth/` directory with files: `auth.routes.ts`, `auth.controller.ts`, `auth.service.ts`, `auth.repository.ts`, `auth.schema.ts`
- [x] 3.2 Define Zod request validation schemas in `auth.schema.ts`: `requestOtpSchema` (username), `verifyOtpSchema` (username + otp), `refreshSchema` (refreshToken), `logoutSchema` (refreshToken)

## 4. Repository Layer

- [x] 4.1 Implement `auth.repository.ts` with user lookup by username (`findByUsername`)
- [x] 4.2 Add OTP CRUD methods: `createOtp`, `findValidOtp` (by userId, not expired), `incrementOtpAttempts`, `deleteUserOtps`
- [x] 4.3 Add RefreshToken CRUD methods: `createRefreshToken`, `findRefreshTokenByHash`, `revokeTokenFamily` (revoke all tokens with matching familyId), `revokeToken`

## 5. Service Layer — OTP Login

- [x] 5.1 Implement `login` (request OTP) in `auth.service.ts`: look up user → if user exists, generate random 6-digit OTP → hash → store → send email. Return success regardless of user existence (anti-enumeration).
- [x] 5.2 Implement `verifyOtp` in `auth.service.ts`: check Redis rate limit (5 attempts / 10 min) → look up user → find most recent unused unexpired OTP → compare hash → mark `is_used = true` → issue tokens.
- [x] 5.3 Refactor `core/utils/email.util.ts` to enqueue OTP emails via BullMQ `email-otp` queue (instead of console logging)
- [x] 5.4 Create Redis config singleton in `config/redis.ts` with `maxRetriesPerRequest: null` for BullMQ
- [x] 5.5 Create BullMQ queue definition in `core/queues/email.queue.ts` with 3 retry attempts + exponential backoff
- [x] 5.6 Create email worker in `workers/email.worker.ts` using Nodemailer (`service: "gmail"`) with styled HTML OTP template
- [x] 5.7 Add `REDIS_URL`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` to `env.ts`, `.env`, and `.env.example`
- [x] 5.8 Import and start email worker in `server.ts` alongside Redis connection

## 6. Service Layer — JWT Session

- [x] 6.1 Create JWT utility in `core/utils/jwt.util.ts`: `signAccessToken(payload)`, `verifyAccessToken(token)`, `generateRefreshToken()` (crypto random bytes)
- [x] 6.2 Implement `refreshTokens` in `auth.service.ts`: find token by hash → check not revoked → check not expired → if revoked, trigger family-wide revocation → revoke old token → create new token in same family → issue new access token → return pair
- [x] 6.3 Implement `logout` in `auth.service.ts`: find token by hash → revoke entire family → return success (always 200, even if token not found)

## 7. Controller & Routes

- [x] 7.1 Implement `auth.controller.ts` with handlers: `handleRequestOtp`, `handleVerifyOtp`, `handleRefresh`, `handleLogout`
- [x] 7.2 Implement `auth.routes.ts` with routes: `POST /login`, `POST /verify-otp`, `POST /refresh`, `POST /logout` — all using `validate()` middleware
- [x] 7.3 Mount auth routes in `app.ts` at `/api/v1/auth` — these routes MUST be placed BEFORE the global `authenticate` middleware (they are public)
- [x] 7.4 Install `cookie-parser` and `@types/cookie-parser`
- [x] 7.5 Register `cookie-parser` in `app.ts`
- [x] 7.6 Refactor `AuthController.verifyOtp` to set `refreshToken` cookie and return only `accessToken` in body
- [x] 7.7 Refactor `AuthController.refresh` to read token from cookie and rotate the cookie
- [x] 7.8 Refactor `AuthController.logout` to clear the `refreshToken` cookie
- [x] 7.9 Update `AuthSchema` to remove `refreshToken` from body validation for `/refresh` and `/logout`
- [x] 7.10 Refactor `AuthController` to use `responseWrapper` (`res.ok`) for consistent responses

## 8. Layered Middleware Implementation

- [x] 8.1 Create `authenticate` middleware in `core/middlewares/auth.middleware.ts` (beneath `checkApiKey`): extract Bearer token → verify JWT signature (CPU-only) → attach `{ id, role }` to `req.user` → call next()
- [x] 8.2 Add `authorize(...roles: Role[])` middleware factory in `core/middlewares/auth.middleware.ts`
- [x] 8.3 Update `types/express.d.ts` to extend `Request` with `user?: { id: string; role: "STUDENT" | "ADMIN" | "STAFF" }`
- [x] 8.4 Update `app.ts`: keep `checkApiKey` as the first global middleware. Apply `authenticate` as a second global middleware after public auth routes.

## 9. Integration & Verification

- [x] 9.1 Seed a test user (student, admin, staff) via a Prisma seed script for manual testing
- [x] 9.2 Verify the full OTP flow end-to-end: request OTP → verify OTP → receive tokens → use access token on a protected route → refresh token → logout
- [ ] 9.3 Verify RBAC: confirm student cannot access admin-only routes, staff can access check-in routes
- [ ] 9.4 Verify security: confirm expired tokens are rejected, revoked refresh tokens trigger family revocation, anti-enumeration works on OTP request
