import type { Request, Response, NextFunction } from "express";
import { registrationsService } from "./registrations.service.js";

export class RegistrationsController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const workshopId = String(req.params.id);
      const userId = req.user!.id;
      const idempotencyKey = String(req.header("x-idempotency-key"));

      const result = await registrationsService.initiateRegistration(
        userId,
        workshopId,
        idempotencyKey,
      );

      return res.status(202).json({
        success: true,
        message: "Registration accepted",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const registrationsController = new RegistrationsController();
