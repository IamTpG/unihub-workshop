# Specification: Authentication & Authorization

## Description
This feature provides identity verification and role-based access control (RBAC) for all UniHub Workshop users. The system uses **stateless JSON Web Tokens (JWT)** for authentication and enforces three distinct permission levels — `STUDENT`, `ADMIN`, and `STAFF` — via an Authorization Middleware at the API routing layer.

Key capabilities:
- **OTP-based passwordless login** using a username (student ID for students, assigned username for staff/admin) and a hashed 6-digit pin sent to the user's registered email.
- **JWT access + refresh token pair** with **Refresh Token Rotation** — access tokens are short-lived (15 min), refresh tokens are long-lived (7 days) and rotated on every use to limit the blast radius of a leaked token.
- **Offline token caching** on the React Native mobile app, allowing staff to remain authenticated in zero-connectivity environments.
- **Role-based endpoint protection** enforced at the API Gateway / middleware level.

## Main Flow

### 1. Login (OTP Flow)
1. **Client** sends `POST /api/v1/auth/login` with `{ username }`.
   - `username` is the **student ID** (e.g., `23127000`) for students, or an **assigned username** for staff and admin (e.g., `admin`, `staff_nguyen`).
2. **Core API** looks up the user in the `User` table by `student_id` (for students) or `username` (for staff/admin).
3. **Core API** generates a cryptographically random 6-digit OTP.
4. **Core API** hashes the OTP and stores it in the `OtpToken` table:
   - `user_id` (FK)
   - `hashed_code` (bcrypt)
   - `expires_at` = now + 10 minutes
   - `is_used` = false
5. **Core API** enqueues a job to the **BullMQ** `email-otp` queue.
6. **Email Worker** sends a styled HTML email via **Nodemailer** (Gmail SMTP) to the user's registered email address.
7. **Core API** returns `200 OK` with a generic message "OTP sent to your registered email if the account exists" regardless of whether the user was found (anti-enumeration).
8. **Client** submits `POST /api/v1/auth/verify-otp` with `{ username, otp }`.
9. **Core API** resolves the username to a user, then fetches the most recent unused OTP for that user where `expires_at > now`.
   - Compares the submitted code against `hashed_code` using bcrypt.
   - If match → mark `is_used = true`, proceed to step 10.
   - If no match or expired → return `401 Invalid or Expired OTP`.
10. **Core API** issues a **token pair**:
   - **Access Token** (JWT) — short-lived, used for API authorization:
     - `sub`: user UUID
     - `role`: `STUDENT` | `ADMIN` | `STAFF`
     - `iat`: issued-at timestamp
     - `exp`: expiration timestamp (**TTL = 15 minutes**)
   - **Refresh Token** — opaque UUID, long-lived, used only to obtain new token pairs:
     - Stored in the `REFRESH_TOKENS` table with `user_id`, `token_hash`, `family_id`, `expires_at` (TTL = 7 days), and `is_revoked = false`.
8. **Client** stores the tokens:
   - **React (Web):** Access token in memory (JS variable / React context). Refresh token in an `httpOnly`, `Secure`, `SameSite=Strict` cookie — never accessible to JavaScript.
   - **React Native (Mobile):** Both tokens in `react-native-keychain` / `expo-secure-store`. Never stored in AsyncStorage or plain storage.

### 2. Authenticated Request Flow
1. **Client** sends a request with the `Authorization: Bearer <token>` header.
2. **API Gateway / Auth Middleware** intercepts the request:
   - Verifies the JWT signature using the server's secret key (CPU-level cryptographic operation — no database hit).
   - Checks `exp` to ensure the token is not expired.
   - Extracts `role` and `sub` (user ID) from the payload.
3. **Auth Middleware** enforces RBAC rules based on the route:

   | Role      | Allowed Endpoints                                         |
   |-----------|-----------------------------------------------------------|
   | `STUDENT` | `GET /workshops`, `POST /registrations`                   |
   | `ADMIN`   | `POST/PUT/DELETE /workshops`, `GET /reports`, `POST /upload-pdf` |
   | `STAFF`   | `POST /check-in`, `POST /sync-offline-data`               |

4. The middleware also verifies that the `user_id` in the token matches the resource being acted upon (e.g., a student can only view/cancel their own registrations).
5. If authorized → forward to the Core API handler.
6. If unauthorized → return `403 Forbidden`.

### 3. Token Refresh Flow (Rotation)
1. **Client** detects the access token is expired (or receives a `401 Token Expired` response).
2. **Client** sends `POST /api/v1/auth/refresh`:
   - **React (Web):** The refresh token is automatically sent via the `httpOnly` cookie. No JS code touches it.
   - **React Native (Mobile):** The app reads the refresh token from secure storage and sends it in the request body (legacy support) or via cookies if the mobile client supports it.
3. **Core API** hashes the incoming token and looks it up in `REFRESH_TOKENS`:
   - Checks `is_revoked = false` and `expires_at > now`.
   - If valid → proceed to step 4.
   - If **revoked** (reuse detected) → **Revoke the entire token family** (all `REFRESH_TOKENS` rows with the same `family_id`). Return `401 Token Reuse Detected`. The user must re-authenticate via OTP. This prevents an attacker from silently using a stolen token.
   - If expired → return `401 Refresh Token Expired`.
4. **Core API** marks the current refresh token as `is_revoked = true` (it has been consumed).
5. **Core API** issues a **new token pair** (new access token + new refresh token) with the same `family_id`.
6. **Client** replaces both stored tokens with the new pair.

> **Token Family:** All refresh tokens originating from a single login share a `family_id` (UUID). This allows mass-revocation if any token in the chain is reused after rotation.

#### Client-Side Implementation

**React (Web) — Axios Interceptor:**
- An Axios response interceptor catches `401` errors.
- It queues concurrent requests, calls `POST /auth/refresh` (cookie is sent automatically), receives the new access token in the response body, updates the in-memory token, and retries the queued requests.
- Uses a mutex/flag to prevent multiple simultaneous refresh calls.

**React Native (Mobile) — Axios Interceptor:**
- Same interceptor pattern as web.
- Reads the refresh token from `react-native-keychain`, sends it in the request body to `POST /auth/refresh`.
- Stores the new token pair back into secure storage.
- If refresh fails → navigates the user to the login screen.

### 4. Mobile Offline Authentication
1. **Staff member** logs in while connected to Wi-Fi (receives token pair via the standard OTP flow).
2. **React Native app** caches both tokens in `react-native-keychain` (secure storage).
3. **When offline**, the app locally decodes the cached access token, checks `exp`, and verifies the `role` is `STAFF` to grant access to the QR scanner.
4. **When back online**, the app first attempts a token refresh (if access token expired), then uses the fresh access token for the `POST /sync-offline-data` bulk upload. If the refresh token has also expired during the offline period, the app prompts re-authentication.

### 5. Logout Flow
1. **Client** sends `POST /api/v1/auth/logout`.
2. **Core API** revokes the entire token family (marks current family's tokens as revoked/deleted).
3. **React (Web):** Clears the in-memory access token and instructs the browser to delete the refresh cookie.
4. **React Native (Mobile):** Deletes both tokens from secure storage.

## Data Model Addition
### OtpToken Table (Mapped to `otp_tokens`)
```
OtpToken {
   uuid id PK
   uuid userId FK
   string hashedCode "Bcrypt hash of 6-digit OTP"
   datetime expiresAt "Strict 10-minute TTL"
   datetime createdAt
}
```
### RefreshToken Table (Mapped to `refresh_tokens`)
```
RefreshToken {
   uuid        id              PK
   uuid        userId          FK  "References User.id"
   string      tokenHash       "Bcrypt hash of the opaque refresh token"
   uuid        familyId        "Groups all tokens from a single login session"
   datetime    expiresAt       "TTL = 7 days from issuance"
   datetime    createdAt
}
```

## Error Scenarios

| Scenario                          | System Behavior                                                                                              |
|-----------------------------------|--------------------------------------------------------------------------------------------------------------|
| **Expired or Invalid OTP**        | Return `401 Invalid or Expired OTP`. User must request a new code via `POST /api/v1/auth/login`.             |
| **OTP Already Used**              | Implementation returns `401 Invalid or Expired OTP` to maintain a consistent surface for attackers.           |
| **Expired Access Token**          | Auth Middleware returns `401 Invalid or expired token`. Client interceptor silently refreshes.                |
| **Expired Refresh Token**         | Return `401 Refresh token expired. Please log in again.`. Client must re-authenticate via OTP.               |
| **Refresh token reuse detected**  | The entire token family is revoked. Return `401 Security alert: session revoked. Please log in again.`.      |
| **Tampered JWT**                  | Signature verification fails. Return `401 Invalid or expired token`.                                         |
| **Wrong role for endpoint**       | Return `403 Insufficient permissions`.                                                                       |
| **Missing/Invalid API Key**       | Return `401 Missing API Key` or `403 Invalid API Key` (Layer 1 Gateway).                                     |
| **Brute-force OTP attempts**      | Rate limit `POST /api/v1/auth/verify-otp` (Redis counter) and return `429 Too Many Requests`.                |
| **Email delivery failure**        | BullMQ job fails and retries. API continues to return `200 OK` to prevent user enumeration.                  |
| **Offline access token expiry**   | Mobile app attempts refresh when back online. If refresh token is also expired → prompt re-authentication.    |

## Constraints

- **Access Token TTL**: 15 minutes. Short-lived to minimize blast radius of a leaked token. The client-side interceptor handles transparent renewal.
- **Refresh Token TTL**: 7 days. Long enough for staff offline usage. Rotated on every use — a refresh token is single-use.
- **OTP TTL**: 10 minutes. Strict expiration to minimize the attack window.
- **Refresh token rotation is mandatory**: Every call to `POST /auth/refresh` invalidates the consumed token and issues a new pair. Reuse of a consumed token triggers family-wide revocation.
- **Refresh tokens are server-side state**: Unlike access tokens, refresh tokens require a database lookup (`REFRESH_TOKENS` table). This is acceptable because refresh calls are infrequent (once every 15 min at most) and never happen during the traffic spike's critical path.
- **Performance under load**: Auth Middleware for access tokens must never hit the database. All verification is CPU-bound (signature check). This is critical during the 12,000-user spike.
- **OTP hashing**: Codes must be stored hashed with bcrypt (never plaintext).
- **Refresh token hashing**: The opaque token is hashed with bcrypt before storage.
- **Rate limiting**: The `POST /api/v1/auth/verify-otp` endpoint must be rate-limited (Redis) to prevent brute-force attacks on the 6-digit code space.
- **Platform storage rules**:
  - React (Web): Access token in memory only. Refresh token in `httpOnly` cookie only. Never in `localStorage`.
  - React Native (Mobile): Both tokens in `react-native-keychain` / `expo-secure-store`. Never in `AsyncStorage`.

## Acceptance Criteria

### OTP Login
- [ ] A student can request an OTP via `POST /api/v1/auth/login` using their student ID and receive a success response regardless of account existence.
- [ ] A staff/admin can request an OTP via `POST /api/v1/auth/login` using their assigned username and receive a success response regardless of account existence.
- [ ] A valid OTP returns an access token (15 min TTL) and sets a secure `httpOnly` refresh token cookie (7 day TTL).
- [ ] An expired or invalid OTP is rejected with `401`.
- [ ] Brute-force OTP attempts are rate-limited and return `429 Too Many Requests`.
- [ ] All OTP codes are stored as bcrypt hashes; raw codes never appear in server logs.

### Token Refresh & Rotation
- [ ] `POST /api/v1/auth/refresh` with a valid refresh token cookie returns a new access token and rotates the refresh token cookie.
- [ ] Reusing a previously rotated refresh token revokes the **entire token family** and returns `401`.
- [ ] The new refresh token shares the same `familyId` as the original.
- [ ] Refresh tokens are stored as bcrypt hashes.

### RBAC & Middleware
- [ ] The Auth Middleware correctly blocks unauthorized role-endpoint combinations with `403`.
- [ ] A `STUDENT` cannot access `POST /check-in` or `DELETE /workshops`.
- [ ] A `STAFF` member cannot access `POST /registrations` or `DELETE /workshops`.
- [ ] Access token verification does not issue any database queries (verified via query logging under load test).

### Client Integration
- [ ] **React (Web):** Access token is stored in memory; refresh token is in an `httpOnly` cookie. `localStorage` is never used for tokens.
- [ ] **React (Web):** Axios interceptor transparently refreshes on `401` without user interaction.
- [ ] **React Native (Mobile):** Both tokens are stored in `react-native-keychain` / `expo-secure-store`.
- [ ] **React Native (Mobile):** Axios interceptor handles refresh and retries failed requests.
- [ ] The React Native app can authenticate the staff user offline using a cached, non-expired access token.

### Logout
- [ ] `POST /api/v1/auth/logout` revokes the entire token family for the session and clears the cookie.
- [ ] React clears in-memory token and deletes the refresh cookie.
- [ ] React Native deletes both tokens from secure storage.
