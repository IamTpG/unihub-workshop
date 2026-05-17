import { Queue } from "bullmq";
import {
  REGISTRATION_QUEUE_NAME,
  REGISTRATION_EMAIL_QUEUE_NAME,
  NOTIFICATION_QUEUE_NAME,
  type RegistrationJobData,
  type RegistrationConfirmedEmailJobData,
  type NotificationJobData,
} from "@unihub/shared";
import { redis } from "../redis/redis.js";

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: true,
  removeOnFail: false,
};

export const registrationQueue = new Queue<RegistrationJobData>(REGISTRATION_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions,
});

export const notificationQueue = new Queue<NotificationJobData>(NOTIFICATION_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions,
});

export const registrationEmailQueue = new Queue<RegistrationConfirmedEmailJobData>(
  REGISTRATION_EMAIL_QUEUE_NAME,
  { connection: redis, defaultJobOptions },
);
