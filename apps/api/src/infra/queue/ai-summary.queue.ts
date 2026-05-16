import { Queue } from "bullmq";
import { AI_SUMMARY_QUEUE_NAME, type AiSummaryJobData } from "@unihub/shared";
import { redis } from "../redis/redis";

export class AiSummaryQueue {
  private readonly queue = new Queue<AiSummaryJobData>(AI_SUMMARY_QUEUE_NAME, {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  });

  async enqueueSummary(workshopId: string, filePath: string): Promise<void> {
    await this.queue.add("summarize-workshop-pdf", { workshopId, filePath });
    console.log(
      `[AI_SUMMARY_SERVICE] summarize workshop pdf job enqueued for workshop ${workshopId}`,
    );
  }
}

export const aiSummaryQueue = new AiSummaryQueue();
