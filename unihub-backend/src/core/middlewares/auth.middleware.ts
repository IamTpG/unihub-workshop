import type { Request, Response, NextFunction } from "express";
import { env } from "../../config/env";

export const checkApiKey = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const apiKey = req.header("x-api-key");

  if (!apiKey) {
    return res.error("Missing API Key.", [], 401);
  }

  if (apiKey === env.API_KEY) {
    next();
  } else {
    return res.error("Invalid API Key", [], 403);
  }
};
