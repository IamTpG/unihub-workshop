import type { Request, Response, NextFunction } from "express";

export const responseWrapper = (req: Request, res: Response, next: NextFunction) => {
  res.ok = (message = "Success", data: unknown = null) => {
    return res.status(200).json({ success: true, message, data });
  };

  res.created = (message = "Created", data: unknown = null) => {
    return res.status(201).json({ success: true, message, data });
  };

  res.error = (message = "Error", errors: unknown[] = [], status = 400) => {
    return res.status(status).json({ success: false, message, errors });
  };

  res.notFound = (message = "Not Found") => {
    return res.status(404).json({ success: false, message, errors: [] });
  };

  next();
};
