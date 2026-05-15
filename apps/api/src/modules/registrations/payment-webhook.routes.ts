import { Router } from "express";
import { paymentWebhookController } from "./payment-webhook.controller.js";

const router = Router();

router.post("/webhook/:provider", paymentWebhookController.handleWebhook);

export default router;
