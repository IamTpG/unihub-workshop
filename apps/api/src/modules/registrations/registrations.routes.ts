import { Router } from "express";
import { Role } from "@unihub/db";
import { authenticate } from "../../middleware/auth.middleware.js";
import { requireRoles } from "../../middleware/rbac.middleware.js";
import { idempotency } from "../../middleware/idempotency.middleware.js";
import { registrationLimiter } from "../../infra/rate-limit/index.js";
import { registrationsController } from "./registrations.controller.js";

const router = Router();

router.post(
  "/workshops/:id/register",
  authenticate,
  requireRoles([Role.STUDENT]),
  registrationLimiter,
  idempotency(),
  registrationsController.register,
);

router.get(
  "/registrations",
  authenticate,
  requireRoles([Role.STUDENT]),
  registrationsController.listRegistrations,
);

router.get(
  "/registrations/:id",
  authenticate,
  requireRoles([Role.STUDENT]),
  registrationsController.getRegistration,
);

router.post(
  "/registrations/:id/retry-payment",
  authenticate,
  requireRoles([Role.STUDENT]),
  registrationsController.retryPayment,
);

export default router;
