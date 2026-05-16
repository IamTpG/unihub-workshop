import { Worker, type Job } from "bullmq";
import { prisma, RegStatus } from "@unihub/db";
import {
  REGISTRATION_QUEUE_NAME,
  PAYMENT_TIMEOUT_QUEUE_NAME,
  type RegistrationJobData,
  type PaymentTimeoutJobData,
  type NotificationJobData,
} from "@unihub/shared";
import { redis, notificationQueue, paymentTimeoutQueue } from "../queue.js";
import { paymentBreaker } from "../infra/payment-breaker.js";

const PAYMENT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const workshopSlotKey = (id: string) => `workshop:${id}:slots`;

async function processRegistration(job: Job<RegistrationJobData>) {
  const { userId, workshopId, idempotencyKey } = job.data;

  console.log(`[REGISTRATION_PROCESSOR] Processing job ${job.id} for user ${userId}`);

  let registrationId: string;
  let workshopPrice: number;

  // Stage 1: Atomic DB transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.$executeRaw`
        UPDATE workshops
        SET available_slots = available_slots - 1
        WHERE id = ${workshopId}::uuid
          AND available_slots > 0
      `;

      if (updated === 0) {
        throw new Error("NO_SEATS_AVAILABLE");
      }

      const workshop = await tx.workshop.findUniqueOrThrow({
        where: { id: workshopId },
        select: { price: true },
      });

      const registration = await tx.registration.create({
        data: { userId, workshopId, idempotencyKey, status: RegStatus.PENDING },
      });

      return { registration, price: Number(workshop.price) };
    });

    registrationId = result.registration.id;
    workshopPrice = result.price;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "NO_SEATS_AVAILABLE") {
      await redis.incr(workshopSlotKey(workshopId));
      console.warn(`[REGISTRATION_PROCESSOR] No seats left in DB for workshop ${workshopId}`);
      throw new Error("Workshop Full - no seats remaining in DB");
    }
    throw err;
  }

  // Stage 2: Payment or direct PAID
  if (workshopPrice === 0) {
    await prisma.registration.update({
      where: { id: registrationId },
      data: { 
        status: RegStatus.PAID,
        qrStub: registrationId,
      },
    });

    const notifData: NotificationJobData = {
      userId,
      workshopId,
      registrationId,
      type: "REGISTRATION_CONFIRMED",
      title: "Registration Confirmed",
      body: "Your spot has been reserved.",
    };
    await notificationQueue.add("notify", notifData);

    console.log(`[REGISTRATION_PROCESSOR] Free workshop - registration ${registrationId} PAID`);
    return;
  }

  // Paid workshop — create payment intent using circuit breaker
  let intentId: string | undefined;

  try {
    const intent = (await paymentBreaker.fire(workshopPrice, "VND", {
      userId,
      workshopId,
      registrationId,
    })) as any; // Using any as a quick fix or use CreateIntentResult if imported
    intentId = intent?.intentId;
  } catch (err) {
    console.error(`[REGISTRATION_PROCESSOR] Payment breaker error for job ${job.id}:`, err);
  }

  const expiresAt = new Date(Date.now() + PAYMENT_TIMEOUT_MS);
  await prisma.registration.update({
    where: { id: registrationId },
    data: {
      status: RegStatus.HOLDING,
      paymentRef: intentId ?? null,
      expiresAt,
    },
  });

  const timeoutData: PaymentTimeoutJobData = { registrationId, workshopId };
  await paymentTimeoutQueue.add("timeout", timeoutData, { delay: PAYMENT_TIMEOUT_MS });

  if (!intentId) {
    const notifData: NotificationJobData = {
      userId,
      workshopId,
      registrationId,
      type: "PAYMENT_RETRY",
      title: "Payment Pending",
      body: "Your seat is held for 30 minutes while we retry payment.",
    };
    await notificationQueue.add("notify", notifData);
    console.warn(
      `[REGISTRATION_PROCESSOR] Payment intent failed for ${registrationId}, seat held 30 min`,
    );
  } else {
    console.log(
      `[REGISTRATION_PROCESSOR] Registration ${registrationId} HOLDING, intent ${intentId}`,
    );
  }
}

export const registrationProcessor = new Worker<RegistrationJobData>(
  REGISTRATION_QUEUE_NAME,
  processRegistration,
  {
    connection: redis,
    concurrency: 1000,
  },
);

registrationProcessor.on("failed", (job, err) => {
  console.error(`[REGISTRATION_PROCESSOR] Job ${job?.id} failed:`, err.message);
});

registrationProcessor.on("completed", (job) => {
  console.log(`[REGISTRATION_PROCESSOR] Job ${job.id} completed`);
});

// Seed Redis slot counter for a workshop if not already set
export async function seedWorkshopSlots(workshopId: string, availableSlots: number) {
  await redis.set(workshopSlotKey(workshopId), String(availableSlots), "NX");
}
