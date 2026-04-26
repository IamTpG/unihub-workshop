## Context

The UniHub Workshop backend currently authenticates all requests with a single shared API key (`x-api-key` header) validated in `auth.middleware.ts`. There is no concept of user identity, sessions, or roles. The Prisma schema has no user-related models. The `_template/` module blueprint exists but no domain modules have been created yet.

The blueprint design document (ADR 3) established the decision to use stateless JWTs over database-backed sessions for two reasons: (1) CPU-only verification survives the 12,000-student traffic spike without exhausting DB connections, and (2) the React Native staff app can decode the token locally to authorize offline QR scanning.

The authentication flow is passwordless OTP-based: username → OTP delivered to email → JWT pair issued. Users are provisioned externally (students via CSV batch, admins/staff manually or via seed) — this change does **not** include user registration.

## Goals / Non-Goals

**Goals:**
- Implement the full OTP-based passwordless login flow with email delivery
- Issue short-lived access tokens (15 min) and long-lived refresh tokens (7 days) as a JWT pair
- Support token rotation with family-based revocation to detect token theft
- Provide reusable `authenticate` and `authorize` middleware for all future modules
- Keep auth middleware CPU-only (zero DB queries on every authenticated request)
- Add the `User`, `OtpToken`, and `RefreshToken` Prisma models using snake_case column mapping (`hashed_code`, `is_used`, `family_id`, etc.)
- Implement Redis-based rate limiting for OTP verification (5 attempts per 10 minutes)
- Implement anti-enumeration on `/login` to prevent user harvesting

**Non-Goals:**
- User self-registration (students are CSV-provisioned, admins/staff are seeded)
- Password-based login (the system is passwordless by design)
- OAuth2 / social login
- Email service implementation (we depend on an external email adapter; this change defines the interface only)
- Rate limiting on auth endpoints (handled separately by the existing `express-rate-limit` infrastructure)
- Mobile or web client-side token management (those are separate frontend concerns)

## Decisions

### D1: OTP storage — Database (Prisma) vs Redis

**Decision:** Store OTPs in PostgreSQL via the `OtpToken` Prisma model.

**Rationale:** OTP requests happen during login. The spec defines a strict 10-minute TTL and an `is_used` flag to prevent replay attacks. We will use Prisma `@map` to ensure column names match the spec (`hashed_code`, `expires_at`, `is_used`).

### D2: Refresh token storage — Database with family tracking

**Decision:** Store refresh tokens in PostgreSQL with a `familyId` column. On rotation, the old token is marked `revoked`. If a revoked token is reused, all tokens in that family are revoked.

**Alternatives considered:**
- **Redis-only storage:** Fast but loses durability on crash. Refresh tokens are long-lived (7 days) and security-critical — they need ACID guarantees.
- **Stateless refresh tokens (no DB):** Cannot support revocation or theft detection.

**Rationale:** The family-based revocation pattern (RFC 6819 §5.2.2.3) is the standard defense against refresh token theft. The DB lookup only happens on `/refresh` and `/logout` calls — never on regular authenticated requests.

### D3: JWT payload — Minimal claims

**Decision:** Access token payload contains only `{ sub: userId, role: Role, iat, exp }`. No email, no name.

**Rationale:** Minimizes token size (important for mobile bandwidth) and avoids stale data issues. If a controller needs user details, it can call the user repository — but the auth middleware itself never touches the DB.

### D4: Module structure — Follow `_template/` pattern

**Decision:** Create `modules/auth/` following the existing layered convention:
```
modules/auth/
├── auth.routes.ts
├── auth.controller.ts
├── auth.service.ts
├── auth.repository.ts
└── auth.schema.ts       # Zod schemas for request validation
```

**Rationale:** Consistency with the project's established DDD module blueprint. No deviation from the architecture.

### D5: OTP hashing — bcrypt

**Decision:** Hash OTPs with `bcryptjs` before storing. Compare with `bcrypt.compare()` on verification.

**Rationale:** If the database is compromised, raw OTPs would allow immediate account takeover. Hashing is cheap for the low volume of OTP operations.

### D6: Middleware Strategy — Layered Defense

**Decision:** Retain `checkApiKey` as the global gateway and add `authenticate` as a secondary session layer.

**Rationale:** This ensures that even if an attacker gets a JWT, they cannot make requests without also possessing the valid static API key (Defense in Depth). The order will be:
1. `checkApiKey` (Global) — Verify `x-api-key`.
2. `authenticate` (Global/Selective) — Verify Bearer JWT.
3. `authorize` (Route-specific) — Verify user Role.

**Email format:** Styled HTML with the OTP code prominently displayed and an expiration notice.

### D8: Refresh Token Transport — httpOnly Cookies

**Decision:** Deliver the `refreshToken` via a secure `httpOnly` cookie instead of the JSON response body. The `accessToken` remains in the JSON body.

**Rationale:** This protects the refresh token (which has a long 7-day life) from being stolen via XSS attacks. JavaScript running in the browser cannot read `httpOnly` cookies. By using `sameSite: "strict"` and `secure: true`, we also mitigate CSRF and ensure the token is only sent over encrypted connections.

**Implementation Details:**
- Use `cookie-parser` middleware to read cookies.
- Cookie name: `refreshToken`.
- Options: `httpOnly: true`, `secure: true`, `sameSite: "strict"`, `path: "/api/v1/auth"`.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| **Token theft via XSS** — Access token stolen from memory | Short TTL (15 min) limits blast radius. Refresh token (long-lived) is stored in an `httpOnly` cookie, making it invisible to malicious JS. |
| **Refresh token replay** — Stolen refresh token used before legitimate user | Family-based revocation: reuse of a rotated token revokes the entire family, forcing re-login. |
| **OTP brute-force** — Attacker guesses 6-digit OTP | Rate limit `POST /auth/verify-otp` to 5 attempts per username per 10-minute window using Redis. OTP expires after 10 min. |
| **Email delivery failure** — OTP never reaches user | OTP emails are dispatched via BullMQ with 3 automatic retries. The API returns success regardless of delivery outcome to prevent user enumeration. Failed jobs are logged for monitoring. |
| **Clock skew on mobile** — Staff JWT appears expired on device with wrong clock | Access token TTL of 15 min provides tolerance. Staff should authenticate while online before entering dead zones. |
