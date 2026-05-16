import type { Request, Response, NextFunction } from "express";
import { env } from "../infra/config/env";
import * as jwtUtils from "../infra/auth/jwt";
import type { Role } from "@unihub/db";
import { UnauthorizedError } from "../infra/errors/AppError";

/**
 * Global Layer 1: Verify static API Key
 */
export const checkApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header("x-api-key");

  if (!apiKey) {
    return res.error("Missing API Key", [], 401);
  }

  if (apiKey === env.API_KEY) {
    next();
  } else {
    return res.error("Invalid API Key", [], 403);
  }
};

/**
 * Global Layer 2: Verify User JWT
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Authentication required"));
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return next(new UnauthorizedError("Invalid token format"));
  }

  try {
    const payload = jwtUtils.verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      role: payload.role as Role,
    };
    next();
  } catch {
    return next(new UnauthorizedError("Invalid or expired token"));
  }
};

/**
 * SSE-compatible auth: accepts Bearer header OR ?token= query param.
 * EventSource cannot set custom headers, so the token is passed in the URL.
 */
export const authenticateSSE = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const rawToken = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : (req.query.token as string | undefined);

  if (!rawToken) {
    return next(new UnauthorizedError("Authentication required"));
  }

  try {
    const payload = jwtUtils.verifyAccessToken(rawToken);
    req.user = { id: payload.sub, role: payload.role as Role };
    next();
  } catch {
    return next(new UnauthorizedError("Invalid or expired token"));
  }
};
