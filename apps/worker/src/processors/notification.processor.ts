import { Worker, type Job } from "bullmq";
import { NOTIFICATION_QUEUE_NAME, type NotificationJobData } from "@unihub/shared";
import { redis } from "../queue.js";

/**
 * Notification Processor
 * Consumes jobs from notification-queue and publishes to Redis Pub/Sub
 * for real-time delivery via SSE.
 */
export async function processNotification(job: Job<NotificationJobData>) {
  const { userId } = job.data;
  console.log(`[NOTIFICATION_PROCESSOR] Processing notification for user ${userId} (job ${job.id})`);

  const channel = `notifications:user:${userId}`;
  const payload = JSON.stringify({
    ...job.data,
    timestamp: new Date().toISOString(),
  });

  try {
    const subscriberCount = await redis.publish(channel, payload);
    console.log(`[NOTIFICATION_PROCESSOR] Published to ${channel} (delivered to ${subscriberCount} listeners)`);
  } catch (error) {
    console.error(`[NOTIFICATION_PROCESSOR] Failed to publish notification to Redis:`, error);
    throw error; // Let BullMQ handle retry
  }
}

export const notificationProcessor = new Worker<NotificationJobData>(
  NOTIFICATION_QUEUE_NAME,
  processNotification,
  {
    connection: redis,
    // Add reasonable retry and concurrency defaults if needed
  },
);

notificationProcessor.on("failed", (job, err) => {
  console.error(`[NOTIFICATION_PROCESSOR] Job ${job?.id} failed:`, err.message);
});
