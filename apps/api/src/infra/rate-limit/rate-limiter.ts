import type { Request } from "express";
import { rateLimit } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redis } from "../redis/redis.js";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  message?: string;
}

export const createRateLimiter = (options: RateLimitOptions) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.call(...args),
    }),
    keyGenerator: options.keyGenerator || ((req) => req.ip || "unknown"),
    validate: false,
    handler: (req, res, _next, options) => {
      res.status(options.statusCode).json({
        success: false,
        message: options.message,
        retryAfter: Math.ceil(options.windowMs / 1000),
      });
    },
    message: options.message || "Too many requests, please try again later.",
  });
};
