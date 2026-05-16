import { Worker, type Job } from "bullmq";
import { prisma, RegStatus } from "@unihub/db";
import {
  PAYMENT_TIMEOUT_QUEUE_NAME,
  type PaymentTimeoutJobData,
  type NotificationJobData,
} from "@unihub/shared";
import { redis, notificationQueue } from "../queue.js";

const workshopSlotKey = (id: string) => `workshop:${id}:slots`;

async function processPaymentTimeout(job: Job<PaymentTimeoutJobData>) {
  const { registrationId, workshopId } = job.data;

  console.log(`[PAYMENT_TIMEOUT_PROCESSOR] Processing timeout for registration ${registrationId}`);

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    select: { status: true, userId: true },
  });

  if (!registration || registration.status !== RegStatus.HOLDING) {
    console.log(
      `[PAYMENT_TIMEOUT_PROCESSOR] Registration ${registrationId} is ${registration?.status ?? "not found"} — no action`,
    );
    return;
  }

  await prisma.$transaction([
    prisma.registration.update({
      where: { id: registrationId },
      data: { status: RegStatus.EXPIRED },
    }),
    prisma.workshop.update({
      where: { id: workshopId },
      data: { availableSlots: { increment: 1 } },
    }),
  ]);

  await redis.incr(workshopSlotKey(workshopId));

  const notifData: NotificationJobData = {
    userId: registration.userId,
    workshopId,
    registrationId,
    type: "REGISTRATION_EXPIRED",
    title: "Reservation Expired",
    body: "Your seat reservation has expired. Please register again.",
  };
  await notificationQueue.add("notify", notifData);

  console.log(
    `[PAYMENT_TIMEOUT_PROCESSOR] Registration ${registrationId} EXPIRED, seat released for workshop ${workshopId}`,
  );
}

export const paymentTimeoutProcessor = new Worker<PaymentTimeoutJobData>(
  PAYMENT_TIMEOUT_QUEUE_NAME,
  processPaymentTimeout,
  {
    connection: redis,
    concurrency: 100,
  },
);

paymentTimeoutProcessor.on("failed", (job, err) => {
  console.error(`[PAYMENT_TIMEOUT_PROCESSOR] Job ${job?.id} failed:`, err.message);
});

paymentTimeoutProcessor.on("completed", (job) => {
  console.log(`[PAYMENT_TIMEOUT_PROCESSOR] Job ${job.id} completed`);
});
