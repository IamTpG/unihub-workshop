import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { env } from "../../config/env";

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  return res.notFound(`Can't find ${req.originalUrl} on this server`);
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error("Error: ", err);

  // If it's our custom error, we use its built-in status code
  if (err instanceof AppError) {
    return res.error(err.message, err.errors, err.statusCode);
  }

  // If it's a generic unhandled bug, default to 500
  return res.error(
    "Internal Server Error",
    env.NODE_ENV === "development" ? [err.stack] : [],
    500,
  );
};
