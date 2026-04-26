import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { env } from "../../config/env";

export const notFoundHandler = (req: Request, res: Response, _next: NextFunction) => {
  return res.notFound(`Can't find ${req.originalUrl} on this server`);
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error("Error: ", err);

  if (err instanceof AppError) {
    return res.error(err.message, err.errors, err.statusCode);
  }

  return res.error(
    "Internal Server Error",
    env.NODE_ENV === "development" && err instanceof Error ? [err.stack] : [],
    500,
  );
};
