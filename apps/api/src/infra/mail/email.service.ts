import { Queue } from "bullmq";
import { EMAIL_OTP_QUEUE_NAME, type OtpEmailJobData } from "@unihub/shared";
import { redis } from "../redis/redis";

export interface IEmailService {
  sendOtpEmail(email: string, otp: string): Promise<void>;
}

/**
 * Email service that dispatches OTP emails via BullMQ queue.
 * Actual SMTP delivery is handled by apps/worker/src/processors/mail.processor.ts.
 */
export class EmailService implements IEmailService {
  private readonly queue = new Queue<OtpEmailJobData>(EMAIL_OTP_QUEUE_NAME, {
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

  async sendOtpEmail(email: string, otp: string): Promise<void> {
    await this.queue.add("send-otp", { to: email, otp });
    console.log(`[EMAIL_SERVICE] OTP email job enqueued for ${email}`);
  }
}

export const emailService = new EmailService();
