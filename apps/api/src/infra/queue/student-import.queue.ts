import { Queue } from "bullmq";
import { STUDENT_IMPORT_QUEUE_NAME, type StudentImportJobData } from "@unihub/shared";
import { redis } from "../redis/redis.js";

const defaultJobOptions = {
  attempts: 1,
  removeOnComplete: true,
  removeOnFail: false,
};

export const studentImportQueue = new Queue<StudentImportJobData>(
  STUDENT_IMPORT_QUEUE_NAME,
  { connection: redis, defaultJobOptions },
);
