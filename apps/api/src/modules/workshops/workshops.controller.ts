import type { NextFunction, Request, Response } from "express";
import { workshopsService } from "./workshops.service";
import type { ListWorkshopsQuery, WorkshopIdParams } from "./workshops.schema";

export class WorkshopsController {
  async listPublished(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.validated.query as ListWorkshopsQuery;
      const workshops = await workshopsService.listPublished(query);

      return res.ok("Workshops retrieved successfully", workshops);
    } catch (error) {
      return next(error);
    }
  }

  async getDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.validated.params as WorkshopIdParams;
      const workshop = await workshopsService.getDetail(id);

      return res.ok("Workshop retrieved successfully", workshop);
    } catch (error) {
      return next(error);
    }
  }

  async getAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.validated.params as WorkshopIdParams;
      const availability = await workshopsService.getAvailability(id);

      return res.ok("Workshop availability retrieved successfully", availability);
    } catch (error) {
      return next(error);
    }
  }
}

export const workshopsController = new WorkshopsController();
