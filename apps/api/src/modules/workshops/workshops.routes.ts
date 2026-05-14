import { Router } from "express";
import { Role } from "@unihub/db";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { workshopsController } from "./workshops.controller";
import { listWorkshopsQuerySchema, workshopIdParamsSchema } from "./workshops.schema";

const router = Router();
const studentOnly = [authenticate, requireRoles([Role.STUDENT])];

router.get(
  "/",
  ...studentOnly,
  validate({ query: listWorkshopsQuerySchema }),
  workshopsController.listPublished,
);
router.get(
  "/:id/availability",
  ...studentOnly,
  validate({ params: workshopIdParamsSchema }),
  workshopsController.getAvailability,
);
router.get(
  "/:id",
  ...studentOnly,
  validate({ params: workshopIdParamsSchema }),
  workshopsController.getDetail,
);

export default router;
