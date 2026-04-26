import type { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";

interface ValidationSchemas {
  body?: ZodObject;
  params?: ZodObject;
  query?: ZodObject;
  headers?: ZodObject;
}

export const validate =
  (schemas: ValidationSchemas) => (req: Request, res: Response, next: NextFunction) => {
    try {
      req.validated = req.validated || {}; // Initialize

      if (schemas.body) req.validated.body = schemas.body.parse(req.body);
      if (schemas.params) req.validated.params = schemas.params.parse(req.params);
      if (schemas.query) req.validated.query = schemas.query.parse(req.query);
      if (schemas.headers) req.validated.headers = schemas.headers.parse(req.headers);

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const formattedErrors = err.issues.map((e) => ({
          path: e.path.join("."),
          message: e.message,
          code: e.code,
        }));

        return res.error("Validation Error", formattedErrors, 400);
      }

      const errorMessage = err instanceof Error ? err.message : "Unknown Error";
      return res.error(errorMessage, [], 500);
    }
  };
