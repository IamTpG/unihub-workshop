import type { NextFunction, Request, Response } from "express";
import { adminWorkshopsService } from "./admin-workshops.service";
import type {
  CreateWorkshopInput,
  ListWorkshopsQuery,
  UpdateWorkshopInput,
  WorkshopIdParams,
} from "./admin-workshops.schema";

export class AdminWorkshopsController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.validated.body as CreateWorkshopInput;
      const workshop = await adminWorkshopsService.create(body);

      return res.created("Workshop created successfully", workshop);
    } catch (error) {
      return next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.validated.query as ListWorkshopsQuery;
      const result = await adminWorkshopsService.list(query);

      return res.ok("Workshops retrieved successfully", result);
    } catch (error) {
      return next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.validated.params as WorkshopIdParams;
      const workshop = await adminWorkshopsService.getById(id);

      return res.ok("Workshop retrieved successfully", workshop);
    } catch (error) {
      return next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.validated.params as WorkshopIdParams;
      const body = req.validated.body as UpdateWorkshopInput;
      const workshop = await adminWorkshopsService.update(id, body);

      return res.ok("Workshop updated successfully", workshop);
    } catch (error) {
      return next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.validated.params as WorkshopIdParams;
      const stats = await adminWorkshopsService.getStats(id);

      return res.ok("Workshop stats retrieved successfully", stats);
    } catch (error) {
      return next(error);
    }
  }
}

export const adminWorkshopsController = new AdminWorkshopsController();
