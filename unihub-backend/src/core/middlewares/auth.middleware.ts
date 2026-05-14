import type { Request, Response, NextFunction } from "express";
import { env } from "../../config/env";
import * as jwtUtils from "../utils/jwt.util";
import type { Role } from "../../../generated/prisma";
import { UnauthorizedError, ForbiddenError } from "../errors/AppError";

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
 * Selective Layer 3: Role-based Authorization
 *
 * Used on specific routes to restrict access to certain user roles.
 * Must be placed AFTER the `authenticate` middleware.
 *
 * @example
 * // Allow only admins
 * router.get("/stats", authenticate, authorize("ADMIN"), controller.getStats);
 *
 * @example
 * // Allow staff and admins
 * router.post("/workshops", authenticate, authorize("STAFF", "ADMIN"), controller.create);
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError("Insufficient permissions"));
    }

    next();
  };
};
