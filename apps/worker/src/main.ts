import { mailProcessor } from "./processors/mail.processor";
import { emailOtpQueue, redis } from "./queue";

console.log("UniHub worker started");

const shutdown = async (signal: string) => {
  console.log(`Received ${signal}. Shutting down workers...`);

  await mailProcessor.close();
  await emailOtpQueue.close();
  await redis.quit();

  process.exit(0);
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
