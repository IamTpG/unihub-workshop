import { Router } from "express";
import { authenticate, authenticateSSE } from "../../middleware/auth.middleware.js";
import { streamNotifications } from "./notifications.sse.js";
import { notificationsController } from "./notifications.controller.js";

const router = Router();

router.get("/stream", authenticateSSE, streamNotifications);

router.get("/", authenticate, notificationsController.list);
router.post("/:id/read", authenticate, notificationsController.markRead);
router.post("/read-all", authenticate, notificationsController.markAllRead);

export default router;
