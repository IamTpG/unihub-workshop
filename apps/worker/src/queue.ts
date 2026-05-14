import IORedis from "ioredis";
import { Queue } from "bullmq";
import { EMAIL_OTP_QUEUE_NAME, type OtpEmailJobData } from "@unihub/shared";
import { requireEnv } from "./env";

const redisUrl = requireEnv("REDIS_URL");

export const redis = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const emailOtpQueue = new Queue<OtpEmailJobData>(EMAIL_OTP_QUEUE_NAME, {
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
