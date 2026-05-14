import { Router } from "express";
import { Role } from "@unihub/db";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { adminWorkshopsController } from "./admin-workshops.controller";
import {
  createWorkshopSchema,
  listWorkshopsQuerySchema,
  updateWorkshopSchema,
  workshopIdParamsSchema,
} from "./admin-workshops.schema";

const router = Router();
const adminOnly = [authenticate, requireRoles([Role.ADMIN])];

router.post(
  "/",
  ...adminOnly,
  validate({ body: createWorkshopSchema }),
  adminWorkshopsController.create,
);

router.get(
  "/",
  ...adminOnly,
  validate({ query: listWorkshopsQuerySchema }),
  adminWorkshopsController.list,
);

router.get(
  "/:id",
  ...adminOnly,
  validate({ params: workshopIdParamsSchema }),
  adminWorkshopsController.getById,
);

router.put(
  "/:id",
  ...adminOnly,
  validate({ params: workshopIdParamsSchema, body: updateWorkshopSchema }),
  adminWorkshopsController.update,
);

router.get(
  "/:id/stats",
  ...adminOnly,
  validate({ params: workshopIdParamsSchema }),
  adminWorkshopsController.getStats,
);

export default router;
