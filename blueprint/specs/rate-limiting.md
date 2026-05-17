# Specification: Rate Limiting

## Description

This feature ensures the UniHub Workshop API remains resilient under burst traffic and abusive request patterns. It defines how public, auth, and registration endpoints are throttled using Redis-backed counters.

Key capabilities:

- global per-IP request limiting
- stricter auth endpoint rate limiting
- per-user registration throttling
- role-aware rate limit tiers for STAFF and ADMIN
- Redis persistence for sliding-window state

---

## Main Flow

### 1. Global request gate

1. Every incoming request to `/api/v1/*` passes through the global rate limiter.
2. The middleware tracks requests per IP using a Redis counter.
3. If the counter exceeds `100 / 60 seconds`, the request is rejected with `429 Too Many Requests`.
4. If under limit, the request proceeds.

### 2. Auth endpoint guard

1. Requests to auth routes (`/api/v1/auth/*`) also pass through the auth limiter.
2. The middleware tracks requests per IP using a Redis counter.
3. If the count exceeds `5 / 60 seconds`, return `429` with `Retry-After`.
4. Auth traffic is intentionally stricter than general traffic.

### 3. Registration user limit

1. Authenticated students hitting `POST /api/v1/workshops/:id/register` pass through a per-user limiter.
2. The limiter uses a per-user Redis counter keyed by user ID.
3. If the student exceeds `10 / 60 seconds`, return `429` and do not enqueue a registration job.

### 4. Role-aware tiering

1. After authentication, the system derives `req.user.role` from the JWT.
2. STAFF and ADMIN may receive a higher general limit (for example `200 / 60 seconds`).
3. STUDENT retains the default `100 / 60 seconds` limit.
4. Role tiers apply to global API traffic, not auth-specific or registration-specific policies unless configured.

### 5. Redis-backed persistence

1. Each limiter stores counters in Redis with TTL aligned to 60 seconds.
2. Keys are atomic and survive API restarts.
3. This enables consistent limits across multiple instances.

### 6. Over-limit response

1. When a limit is reached, the API returns `429 Too Many Requests`.
2. The response includes a `Retry-After` seconds header.
3. The body contains a user-friendly message.

Example:

```json
{
  "error": "Too many requests. Please wait 30 seconds and try again."
}
```

---

## Access Control

Rate limiting is applied before route handlers and before any idempotency or queueing logic. The pipeline is:

- global limiter
- auth limiter (for auth routes)
- authentication middleware
- role-aware limiter
- registration limiter (for student registration)
- route handler

This ensures abusive requests are blocked before state changes occur.

---

## Data Model

This feature does not add a database table. It uses Redis counters with per-IP and per-user keys.

Each key stores a sliding-window counter and expires after 60 seconds.

---

## Error Scenarios

| Scenario | Behavior |
| --- | --- |
| Client exceeds global limit | `429 Too Many Requests`, `Retry-After`, no further processing |
| Auth endpoint spam | `429`, `Retry-After`, block the auth request |
| Student spams registration | `429`, do not enqueue registration job |
| Redis unavailable | Prefer safe throttling; log the error and avoid silent failures |

---

## Constraints

- Global default limit: `100 / 60s` per IP.
- Auth limit: `5 / 60s` per IP.
- Registration limit: `10 / 60s` per authenticated student.
- STAFF/ADMIN can use higher general tiers.
- Rate limit counters must be stored in Redis.
- Limiting middleware must run before write-side queue operations.

---

## Acceptance Criteria

- Global limit blocks requests above `100 / 60s` per IP.
- Auth routes are limited to `5 / 60s` per IP.
- Student registration is limited to `10 / 60s` per authenticated user.
- `429` responses include `Retry-After`.
- Rate limit state persists through API restarts.
