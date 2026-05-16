import { Router } from "express";
import { Role } from "@unihub/db";
import { authenticate } from "../../middleware/auth.middleware.js";
import { requireRoles } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { checkinsController } from "./checkins.controller.js";
import * as schemas from "./checkins.schema.js";

const router = Router();

router.post(
  "/verify",
  authenticate,
  requireRoles([Role.STAFF, Role.ADMIN]),
  validate({ body: schemas.verifyCheckInSchema }),
  checkinsController.verifyCheckIn,
);

// Batch check-in (offline sync)
router.post(
  "/batch",
  authenticate,
  requireRoles([Role.STAFF, Role.ADMIN]),
  validate({ body: schemas.batchCheckInSchema }),
  checkinsController.checkInBatch,
);

// Single check-in
router.post(
  "/:registrationId",
  authenticate,
  requireRoles([Role.STAFF, Role.ADMIN]),
  validate({ params: schemas.checkInParamsSchema }),
  checkinsController.checkInSingle,
);

export default router;
