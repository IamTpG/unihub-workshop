import type { Request, Response, NextFunction } from "express";
import { checkinsService } from "./checkins.service.js";
import type { BatchCheckInInput, VerifyCheckInInput } from "./checkins.schema.js";

export class CheckinsController {
  async verifyCheckIn(
    req: Request<Record<string, string>, Record<string, unknown>, VerifyCheckInInput>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await checkinsService.verifyCheckIn(req.body);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }

  async checkInSingle(req: Request, res: Response, next: NextFunction) {
    try {
      const registrationId = String(req.params.registrationId);
      const result = await checkinsService.checkInSingle(registrationId);
      return res.ok("Check-in successful", result);
    } catch (error) {
      return next(error);
    }
  }

  async checkInBatch(
    req: Request<Record<string, string>, Record<string, unknown>, BatchCheckInInput>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await checkinsService.checkInBatch(req.body.items);
      return res.ok("Batch check-in processed", result);
    } catch (error) {
      return next(error);
    }
  }
}

export const checkinsController = new CheckinsController();
