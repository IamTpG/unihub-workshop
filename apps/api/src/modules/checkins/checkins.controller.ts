import type { Request, Response, NextFunction } from "express";
import { checkinsService } from "./checkins.service.js";
import type { BatchCheckInInput } from "./checkins.schema.js";

export class CheckinsController {
  async checkInSingle(req: Request, res: Response, next: NextFunction) {
    try {
      const { registrationId } = req.params;
      const result = await checkinsService.checkInSingle(registrationId);
      res.ok("Check-in successful", result);
    } catch (error) {
      next(error);
    }
  }

  async checkInBatch(
    req: Request<Record<string, string>, Record<string, unknown>, BatchCheckInInput>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await checkinsService.checkInBatch(req.body.items);
      res.ok("Batch check-in processed", result);
    } catch (error) {
      next(error);
    }
  }
}

export const checkinsController = new CheckinsController();
