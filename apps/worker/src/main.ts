import { prisma } from "@unihub/db";
import { mailProcessor, registrationMailProcessor } from "./processors/mail.processor.js";
import { registrationProcessor, seedWorkshopSlots } from "./processors/registration.processor.js";
import { paymentTimeoutProcessor } from "./processors/payment-timeout.processor.js";
import { notificationProcessor } from "./processors/notification.processor.js";
import { studentImportProcessor } from "./processors/student-import.processor.js";
import { aiSummaryProcessor } from "./processors/ai-summary.processor.js";
import {
  emailOtpQueue,
  registrationEmailQueue,
  registrationQueue,
  paymentTimeoutQueue,
  notificationQueue,
  aiSummaryQueue,
  studentImportQueue,
  redis,
} from "./queue.js";

console.log("UniHub worker started");

// ---------------------------------------------------------------------------
// Slot seeding: accounts for registrations already committed in the DB so
// a Redis flush doesn't allow over-registration on restart.
// ---------------------------------------------------------------------------
async function seedAllWorkshopSlots() {
  const workshops = await prisma.workshop.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      capacity: true,
      _count: {
        select: {
          registrations: {
            where: { status: { in: ["HOLDING", "PAID"] } },
          },
        },
      },
    },
  });

  await Promise.all(
    workshops.map((w) => {
      const trueAvailable = w.capacity - w._count.registrations;
      return seedWorkshopSlots(w.id, Math.max(0, trueAvailable));
    }),
  );

  console.log(
    `[WORKER] Seeded Redis slot counters for ${workshops.length} published workshops`,
  );
}

// ---------------------------------------------------------------------------
// Nightly CSV student import (cron: 02:00 every day).
// Set NIGHTLY_CSV_PATH env var to the absolute path of the CSV to be imported.
// If the variable is not set the cron is still registered but the job exits
// immediately with a warning — no error thrown so other jobs are unaffected.
// ---------------------------------------------------------------------------
async function scheduleNightlyCsvImport() {
  const csvPath = process.env.NIGHTLY_CSV_PATH;
  if (!csvPath) {
    console.warn(
      "[WORKER] NIGHTLY_CSV_PATH not set — nightly student import is disabled",
    );
  }

  // Remove any existing repeat job before re-registering to avoid duplicates
  // after worker restarts.
  const repeatJobKey = "nightly-student-import";
  const existingJobs = await studentImportQueue.getRepeatableJobs();
  for (const job of existingJobs) {
    if (job.key.includes(repeatJobKey)) {
      await studentImportQueue.removeRepeatableByKey(job.key);
    }
  }

  await studentImportQueue.add(
    repeatJobKey,
    { importLogId: "nightly", filePath: csvPath ?? "" },
    {
      repeat: { pattern: "0 2 * * *" },
      jobId: repeatJobKey,
    },
  );

  console.log("[WORKER] Nightly student import cron registered (02:00 daily)");
}

// ---------------------------------------------------------------------------
// Boot sequence
// ---------------------------------------------------------------------------
seedAllWorkshopSlots().catch((err) => {
  console.error("[WORKER] Failed to seed slot counters:", err);
});

scheduleNightlyCsvImport().catch((err) => {
  console.error("[WORKER] Failed to schedule nightly CSV import:", err);
});

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
const shutdown = async (signal: string) => {
  console.log(`Received ${signal}. Shutting down workers...`);

  await Promise.all([
    mailProcessor.close(),
    registrationMailProcessor.close(),
    registrationProcessor.close(),
    paymentTimeoutProcessor.close(),
    notificationProcessor.close(),
    aiSummaryProcessor.close(),
    studentImportProcessor.close(),
  ]);

  await Promise.all([
    emailOtpQueue.close(),
    registrationEmailQueue.close(),
    registrationQueue.close(),
    paymentTimeoutQueue.close(),
    notificationQueue.close(),
    aiSummaryQueue.close(),
    studentImportQueue.close(),
  ]);

  await redis.quit();

  process.exit(0);
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
