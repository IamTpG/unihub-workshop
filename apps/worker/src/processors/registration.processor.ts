import { Worker, type Job } from "bullmq";
import { prisma, RegStatus } from "@unihub/db";
import {
  REGISTRATION_QUEUE_NAME,
  type RegistrationJobData,
  type NotificationJobData,
} from "@unihub/shared";
import { redis, notificationQueue, paymentTimeoutQueue, registrationEmailQueue } from "../queue.js";
import { paymentBreaker } from "../infra/payment-breaker.js";

const PAYMENT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const workshopSlotKey = (id: string) => `workshop:${id}:slots`;

// Prisma is exported as type-only from @unihub/db, so we duck-type the error.
const isPrismaUniqueError = (err: unknown): boolean =>
  typeof err === "object" &&
  err !== null &&
  "code" in err &&
  (err as { code: string }).code === "P2002";

async function processRegistration(job: Job<RegistrationJobData>) {
  const { userId, workshopId, idempotencyKey } = job.data;

  console.log(`[REGISTRATION_PROCESSOR] Processing job ${job.id} for user ${userId}`);

  let registrationId: string;
  let workshopPrice: number;
  let isExistingRegistration = false;

  // Stage 1: Atomic DB transaction — decrement slot and create registration.
  // On BullMQ retry the registration.create will throw P2002 (unique idempotencyKey).
  // That rolls back the transaction (slot NOT double-decremented), and we fall
  // through to find the existing record and continue to Stage 2.
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

    // Redis counter follows the DB commit so they stay in sync.
    // The API already decremented Redis optimistically; we skip the decrement
    // here to avoid double-counting (the API decrement is the authoritative one).
  } catch (err) {
    // P2002 = unique constraint violation on idempotencyKey.
    // The registration was created in a previous attempt; the transaction was
    // rolled back so the DB slot was NOT decremented again. Find the existing
    // record and continue to Stage 2 to finish what the first attempt started.
    if (isPrismaUniqueError(err)) {
      // Two possible P2002 sources:
      //   (a) idempotencyKey unique → BullMQ retry of this exact job (expected)
      //   (b) userId+workshopId unique → concurrent race from a different job
      // Distinguish them by checking which record exists.
      const existingByKey = await prisma.registration.findFirst({
        where: { idempotencyKey },
        include: { workshop: { select: { price: true } } },
      });

      if (!existingByKey) {
        // Case (b): userId+workshopId collision from a concurrent job.
        // Our API slot DECR was legitimate but this job must not proceed —
        // restore the Redis slot so the authoritative count stays correct.
        await redis.incr(workshopSlotKey(workshopId));
        console.warn(
          `[REGISTRATION_PROCESSOR] userId+workshopId duplicate for user ${userId} / workshop ${workshopId} — slot restored`,
        );
        return;
      }

      // Case (a): idempotencyKey retry.
      if (existingByKey.status === RegStatus.PENDING) {
        console.warn(
          `[REGISTRATION_PROCESSOR] Duplicate idempotencyKey ${idempotencyKey} — resuming existing registration`,
        );
        registrationId = existingByKey.id;
        workshopPrice = Number(existingByKey.workshop.price);
        isExistingRegistration = true;
      } else {
        // Already progressed past PENDING (e.g., PAID/HOLDING on a previous retry)
        console.log(
          `[REGISTRATION_PROCESSOR] Registration ${existingByKey.id} already in status ${existingByKey.status} — skipping`,
        );
        return;
      }
    } else {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "NO_SEATS_AVAILABLE") {
        // DB slot is gone; restore the Redis counter the API decremented.
        await redis.incr(workshopSlotKey(workshopId));
        console.warn(
          `[REGISTRATION_PROCESSOR] No seats left in DB for workshop ${workshopId}`,
        );
        throw new Error("Workshop Full - no seats remaining in DB");
      }
      throw err;
    }
  }

  // Stage 2: Payment or direct PAID.
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

    // Send confirmation email with QR code.
    const userAndWorkshop = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        fullName: true,
        registrations: {
          where: { id: registrationId },
          select: { workshop: { select: { title: true, startTime: true, location: true } } },
          take: 1,
        },
      },
    });
    const workshop = userAndWorkshop?.registrations[0]?.workshop;
    if (userAndWorkshop?.email && workshop) {
      await registrationEmailQueue.add("registration-confirmed", {
        to: userAndWorkshop.email,
        userName: userAndWorkshop.fullName ?? userAndWorkshop.email,
        workshopTitle: workshop.title,
        workshopDate: workshop.startTime.toISOString(),
        workshopLocation: workshop.location ?? "",
        registrationId,
      });
    }

    console.log(
      `[REGISTRATION_PROCESSOR] Free workshop — registration ${registrationId} PAID`,
    );
    return;
  }

  // Paid workshop — create payment intent via circuit breaker.
  let intentId: string | undefined;

  try {
    const intent = (await paymentBreaker.fire(workshopPrice, "VND", {
      userId,
      workshopId,
      registrationId,
    })) as { intentId?: string; clientSecret?: string } | undefined;
    intentId = intent?.intentId;
  } catch (err) {
    console.error(
      `[REGISTRATION_PROCESSOR] Payment breaker error for job ${job.id}:`,
      err,
    );
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

  if (!isExistingRegistration) {
    // Only schedule a new timeout job on the first successful attempt.
    // Retries skip this because a timeout job was already queued.
    await paymentTimeoutQueue.add("timeout", { registrationId, workshopId }, { delay: PAYMENT_TIMEOUT_MS });
  }

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
