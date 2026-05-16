import { createRateLimiter } from "./rate-limiter.js";

/**
 * Global Rate Limiter
 * 100 req/60s for students/guests
 * 200 req/60s for staff/admin
 */
export const globalLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: (req) => {
    const role = req.user?.role;
    if (role === "ADMIN" || role === "STAFF") return 200;
    return 100;
  },
  message: "Global rate limit exceeded. Please try again later.",
});

/**
 * Auth Rate Limiter
 * 5 req/60s per IP to prevent OTP spam
 */
export const authLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: "Too many login attempts. Please try again after a minute.",
});

/**
 * Registration Rate Limiter
 * 10 req/60s per authenticated user
 */
export const registrationLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => {
    return req.user?.id || req.ip || "unknown";
  },
  message: "You are attempting to register too fast. Please wait a moment.",
});
