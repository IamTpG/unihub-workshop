import { Router } from "express";
import { EntityController } from "./entity.controller";
import {
  EntityGetAllSchema,
  EntityIdSchema,
  EntityCreateSchema,
} from "./entity.schema";
import { validate } from "../../core/middlewares/validate.middleware";

const router = Router();

// GET /api/v1/entities
router.get(
  "/",
  validate({ query: EntityGetAllSchema }),
  EntityController.getAll,
);

// GET /api/v1/entities/:id
router.get(
  "/:id",
  validate({ params: EntityIdSchema }),
  EntityController.getById,
);

// POST /api/v1/entities
router.post(
  "/",
  validate({ body: EntityCreateSchema }),
  EntityController.create,
);

export default router;
