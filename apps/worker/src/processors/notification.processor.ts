import { Worker, type Job } from "bullmq";
import { prisma } from "@unihub/db";
import { NOTIFICATION_QUEUE_NAME, type NotificationJobData } from "@unihub/shared";
import { redis } from "../queue.js";

/**
 * Notification Processor
 * Persists notification to DB (idempotently), then publishes to Redis Pub/Sub for SSE delivery.
 */
export async function processNotification(job: Job<NotificationJobData>) {
  const { userId, type, title, body, registrationId } = job.data;
  console.log(
    `[NOTIFICATION_PROCESSOR] Processing notification for user ${userId} (job ${job.id})`,
  );

  // Build a stable idempotency key from the job's unique attributes so that
  // BullMQ retries create at most one Notification record per logical event.
  const idempotencyKey = `notif:${job.id}`;

  try {
    await prisma.notification.upsert({
      where: { idempotencyKey },
      create: { userId, type, title, body: body ?? null, isRead: false, idempotencyKey },
      update: {},
    });
  } catch (err) {
    const isPrismaUniqueError =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002";

    if (isPrismaUniqueError) {
      console.log(
        `[NOTIFICATION_PROCESSOR] Duplicate notification for job ${job.id} — skipping DB insert`,
      );
    } else {
      throw err;
    }
  }

  const channel = `notifications:user:${userId}`;
  const payload = JSON.stringify({
    ...job.data,
    timestamp: new Date().toISOString(),
  });

  try {
    const subscriberCount = await redis.publish(channel, payload);
    console.log(
      `[NOTIFICATION_PROCESSOR] Published to ${channel} (delivered to ${subscriberCount} listeners)`,
    );
  } catch (error) {
    console.error(
      `[NOTIFICATION_PROCESSOR] Failed to publish notification to Redis:`,
      error,
    );
    throw error; // Let BullMQ handle retry
  }
}

export const notificationProcessor = new Worker<NotificationJobData>(
  NOTIFICATION_QUEUE_NAME,
  processNotification,
  {
    connection: redis,
    concurrency: 10,
  },
);

notificationProcessor.on("failed", (job, err) => {
  console.error(`[NOTIFICATION_PROCESSOR] Job ${job?.id} failed:`, err.message);
});

notificationProcessor.on("completed", (job) => {
  console.log(`[NOTIFICATION_PROCESSOR] Job ${job.id} completed`);
});
