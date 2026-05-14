import type { Request, Response, NextFunction } from "express";
import type { Role } from "@unihub/db";
import { ForbiddenError, UnauthorizedError } from "../infra/errors/AppError";

export const requireRoles = (allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError("Insufficient permissions"));
    }

    return next();
  };
};
