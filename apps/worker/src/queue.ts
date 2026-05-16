import IORedis from "ioredis";
import { Queue } from "bullmq";
import {
  EMAIL_OTP_QUEUE_NAME,
  REGISTRATION_QUEUE_NAME,
  PAYMENT_TIMEOUT_QUEUE_NAME,
  NOTIFICATION_QUEUE_NAME,
  AI_SUMMARY_QUEUE_NAME,
  STUDENT_IMPORT_QUEUE_NAME,
  type OtpEmailJobData,
  type RegistrationJobData,
  type PaymentTimeoutJobData,
  type NotificationJobData,
  type AiSummaryJobData,
  type StudentImportJobData,
} from "@unihub/shared";
import { requireEnv } from "./env.js";

const redisUrl = requireEnv("REDIS_URL");

export const redis = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: true,
  removeOnFail: false,
};

export const emailOtpQueue = new Queue<OtpEmailJobData>(EMAIL_OTP_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions,
});

export const registrationQueue = new Queue<RegistrationJobData>(REGISTRATION_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions,
});

export const paymentTimeoutQueue = new Queue<PaymentTimeoutJobData>(PAYMENT_TIMEOUT_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions,
});

export const notificationQueue = new Queue<NotificationJobData>(NOTIFICATION_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions,
});

export const aiSummaryQueue = new Queue<AiSummaryJobData>(AI_SUMMARY_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions,
});

export const studentImportQueue = new Queue<StudentImportJobData>(STUDENT_IMPORT_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: { ...defaultJobOptions, attempts: 1 },
});
