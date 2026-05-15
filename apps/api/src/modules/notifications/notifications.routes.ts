import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { streamNotifications } from "./notifications.sse.js";

const router = Router();

/**
 * GET /api/v1/notifications/stream
 * Server-Sent Events endpoint for real-time notifications
 */
router.get("/stream", authenticate, streamNotifications);

export default router;
