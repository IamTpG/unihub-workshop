import type { Request, Response, NextFunction } from "express";
import { redis } from "../infra/redis/redis";

const TTL_SECONDS = 86400; // 24 hours

const redisKey = (key: string) => `idempotency:${key}`;

export const idempotency = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = req.header("x-idempotency-key");

    if (!key) {
      return res.error("x-idempotency-key header is required", [], 400);
    }

    const rKey = redisKey(key);
    let existing: string | null;

    try {
      existing = await redis.get(rKey);
    } catch {
      return next();
    }

    if (existing === "IN_PROGRESS") {
      return res.error(
        "Request with this idempotency key is already in progress",
        [],
        409,
      );
    }

    if (existing !== null) {
      const cached = JSON.parse(existing) as { status: number; body: unknown };
      return res.status(cached.status).json(cached.body);
    }

    await redis.set(rKey, "IN_PROGRESS", "EX", TTL_SECONDS);

    const originalJson = res.json.bind(res);
    res.json = function (body: unknown) {
      res.json = originalJson;
      const status = res.statusCode ?? 200;
      if (status < 500) {
        redis
          .set(rKey, JSON.stringify({ status, body }), "EX", TTL_SECONDS)
          .catch(() => {});
      } else {
        redis.del(rKey).catch(() => {});
      }
      return originalJson(body);
    };

    return next();
  };
};
