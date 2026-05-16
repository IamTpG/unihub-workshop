import type { Request, Response, NextFunction } from "express";
import { registrationsRepository } from "./registrations.repository.js";
import { notificationQueue } from "../../infra/queue/registration.queue.js";
import { getPaymentProvider } from "../../infra/payment/payment-provider.factory.js";
import { redis } from "../../infra/redis/redis.js";
import { RegStatus } from "@unihub/db";
import { BadRequestError } from "../../infra/errors/AppError.js";

const WEBHOOK_IDEMPOTENCY_TTL = 86400;
const workshopSlotKey = (workshopId: string) => `workshop:${workshopId}:slots`;
const webhookKey = (eventId: string) => `idempotency:webhook:${eventId}`;

export class PaymentWebhookController {
  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const provider = String(req.params.provider);

      let paymentProvider;
      try {
        paymentProvider = getPaymentProvider(provider);
      } catch {
        throw new BadRequestError("Unknown provider");
      }

      const signature = String(req.headers["x-webhook-signature"] ?? "");
      const providerSecret = process.env.PAYMENT_WEBHOOK_SECRET ?? "mock_secret";

      let event;
      try {
        event = paymentProvider.verifyWebhook(
          JSON.stringify(req.body),
          signature,
          providerSecret,
        );
      } catch {
        throw new BadRequestError("Invalid webhook signature");
      }

      // Webhook-level idempotency using provider event ID
      const rKey = webhookKey(event.eventId);
      const already = await redis.set(rKey, "1", "EX", WEBHOOK_IDEMPOTENCY_TTL, "NX");
      if (already === null) {
        return res.status(200).json({ received: true });
      }

      const registration = await registrationsRepository.findByIntentId(event.intentId);

      if (!registration) {
        return res.status(200).json({ received: true });
      }

      if (registration.status !== RegStatus.HOLDING) {
        return res.status(200).json({ received: true });
      }

      if (event.eventType === "PAYMENT_SUCCEEDED") {
        await registrationsRepository.updateStatus(registration.id, RegStatus.PAID, {
          qrStub: registration.id,
        });

        await notificationQueue.add("notify", {
          userId: registration.userId,
          workshopId: registration.workshopId,
          registrationId: registration.id,
          type: "PAYMENT_SUCCESS",
          title: "Payment Successful",
          body: "Your registration payment has been confirmed.",
        });
      } else {
        const finalStatus =
          event.eventType === "PAYMENT_FAILED" ? RegStatus.FAILED : RegStatus.EXPIRED;

        await registrationsRepository.updateStatus(registration.id, finalStatus);
        await registrationsRepository.releaseSlot(registration.workshopId);
        await redis.incr(workshopSlotKey(registration.workshopId));

        await notificationQueue.add("notify", {
          userId: registration.userId,
          workshopId: registration.workshopId,
          registrationId: registration.id,
          type: "PAYMENT_FAILED",
          title: "Payment Failed",
          body: "Your payment could not be processed. Your seat has been released.",
        });
      }

      return res.status(200).json({ received: true });
    } catch (error) {
      return next(error);
    }
  }
}

export const paymentWebhookController = new PaymentWebhookController();
