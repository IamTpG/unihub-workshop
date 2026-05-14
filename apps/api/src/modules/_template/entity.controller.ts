import type { Request, Response } from "express";
import { EntityService } from "./entity.service";

export const EntityController = {
  async getAll(req: Request, res: Response) {
    try {
      const offset = req.validated?.query?.offset || 1;
      const limit = req.validated?.query?.limit || 10;

      const result = await EntityService.getAll(offset, limit);

      return res.ok(result, "Entities retrieved successfully");
    } catch (error: any) {
      return res.error(error.message, [], 500);
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.validated?.params;
      const result = await EntityService.getById(id);

      return res.ok(result, "Entity retrieved successfully");
    } catch (error: any) {
      // If the service threw a custom AppError, standard error middleware catches it
      // if we throw it up the chain, or we can handle it manually here.
      throw error;
    }
  },

  async create(req: Request, res: Response) {
    try {
      const entityData = req.validated?.body;

      const result = await EntityService.create(entityData);

      return res.created("Entity created successfully", result);
    } catch (error: any) {
      throw error; // Let global error handler catch custom AppErrors
    }
  },
};
