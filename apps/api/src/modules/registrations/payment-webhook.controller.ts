import type { Request, Response, NextFunction } from "express";
import { registrationsRepository } from "./registrations.repository.js";
import {
  notificationQueue,
  registrationEmailQueue,
} from "../../infra/queue/registration.queue.js";
import { getPaymentProvider } from "../../infra/payment/payment-provider.factory.js";
import { redis } from "../../infra/redis/redis.js";
import { prisma, RegStatus } from "@unihub/db";
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

      // Webhook-level idempotency: NX ensures only the first delivery is processed.
      const rKey = webhookKey(event.eventId);
      const acquired = await redis.set(rKey, "1", "EX", WEBHOOK_IDEMPOTENCY_TTL, "NX");
      if (acquired === null) {
        return res.status(200).json({ received: true });
      }

      const registration = await registrationsRepository.findByIntentId(event.intentId);

      if (!registration) {
        return res.status(200).json({ received: true });
      }

      if (event.eventType === "PAYMENT_SUCCEEDED") {
        // Atomic conditional update: only HOLDING → PAID.
        // If the timeout processor already moved it to EXPIRED, count=0 and we no-op.
        const updated = await prisma.registration.updateMany({
          where: { id: registration.id, status: RegStatus.HOLDING },
          data: { status: RegStatus.PAID, qrStub: registration.id },
        });

        if (updated.count === 0) {
          console.warn(
            `[WEBHOOK] PAYMENT_SUCCEEDED for ${registration.id} but status is not HOLDING — skipping`,
          );
          return res.status(200).json({ received: true });
        }

        await notificationQueue.add("notify", {
          userId: registration.userId,
          workshopId: registration.workshopId,
          registrationId: registration.id,
          type: "PAYMENT_SUCCESS",
          title: "Payment Successful",
          body: "Your registration payment has been confirmed.",
        });

        if (registration.user?.email) {
          await registrationEmailQueue.add("registration-confirmed", {
            to: registration.user.email,
            userName: registration.user.fullName ?? registration.user.email,
            workshopTitle: registration.workshop.title,
            workshopDate: registration.workshop.startTime.toISOString(),
            workshopLocation: registration.workshop.location ?? "",
            registrationId: registration.id,
          });
        }
      } else if (
        event.eventType === "PAYMENT_FAILED" ||
        event.eventType === "PAYMENT_EXPIRED"
      ) {
        const finalStatus =
          event.eventType === "PAYMENT_FAILED" ? RegStatus.FAILED : RegStatus.EXPIRED;

        // Atomic conditional update: only HOLDING → FAILED/EXPIRED.
        const updated = await prisma.registration.updateMany({
          where: { id: registration.id, status: RegStatus.HOLDING },
          data: { status: finalStatus },
        });

        if (updated.count === 0) {
          console.warn(
            `[WEBHOOK] ${event.eventType} for ${registration.id} but status is not HOLDING — skipping`,
          );
          return res.status(200).json({ received: true });
        }

        // Release slot in DB and Redis.
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
      } else {
        // Unknown event type — log and acknowledge so the gateway doesn't retry.
        console.warn(
          `[WEBHOOK] Unknown eventType "${event.eventType}" for intentId ${event.intentId} — ignoring`,
        );
      }

      return res.status(200).json({ received: true });
    } catch (error) {
      return next(error);
    }
  }
}

export const paymentWebhookController = new PaymentWebhookController();
