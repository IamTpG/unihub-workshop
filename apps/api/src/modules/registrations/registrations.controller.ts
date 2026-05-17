import type { Request, Response, NextFunction } from "express";
import { RegStatus } from "@unihub/db";
import { registrationsService } from "./registrations.service.js";

export class RegistrationsController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const workshopId = String(req.params.id);
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const idempotencyKey = String(req.header("x-idempotency-key"));

      const result = await registrationsService.initiateRegistration(
        userId,
        workshopId,
        idempotencyKey,
        userRole,
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

  async listRegistrations(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { status } = req.query;

      let statuses: RegStatus[] | undefined;
      if (typeof status === "string") {
        statuses = status
          .split(",")
          .map((s) => s.trim())
          .filter((s) =>
            Object.values(RegStatus).includes(s as RegStatus),
          ) as RegStatus[];
      }

      const registrations = await registrationsService.getUserRegistrations(
        userId,
        statuses,
      );

      return res.json({
        success: true,
        data: registrations,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getRegistration(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const userId = req.user!.id;

      const registration = await registrationsService.getRegistrationDetails(id, userId);

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: "Registration not found",
        });
      }

      return res.json({
        success: true,
        data: registration,
      });
    } catch (error) {
      return next(error);
    }
  }

  async retryPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const userId = req.user!.id;

      const result = await registrationsService.retryPayment(id, userId);

      return res.status(202).json({
        success: true,
        message: "Payment retry accepted",
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const registrationsController = new RegistrationsController();
