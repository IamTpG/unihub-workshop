import { prisma } from "@unihub/db";
import { mailProcessor } from "./processors/mail.processor.js";
import { registrationProcessor, seedWorkshopSlots } from "./processors/registration.processor.js";
import { paymentTimeoutProcessor } from "./processors/payment-timeout.processor.js";
import { notificationProcessor } from "./processors/notification.processor.js";
import { studentImportProcessor } from "./processors/student-import.processor.js";
import { emailOtpQueue, registrationQueue, paymentTimeoutQueue, notificationQueue, studentImportQueue, redis } from "./queue.js";

console.log("UniHub worker started");

async function seedAllWorkshopSlots() {
  const workshops = await prisma.workshop.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, availableSlots: true },
  });

  await Promise.all(
    workshops.map((w) => seedWorkshopSlots(w.id, w.availableSlots)),
  );

  console.log(`[WORKER] Seeded Redis slot counters for ${workshops.length} published workshops`);
}

seedAllWorkshopSlots().catch((err) => {
  console.error("[WORKER] Failed to seed slot counters:", err);
});

const shutdown = async (signal: string) => {
  console.log(`Received ${signal}. Shutting down workers...`);

  await Promise.all([
    mailProcessor.close(),
    registrationProcessor.close(),
    paymentTimeoutProcessor.close(),
    notificationProcessor.close(),
    studentImportProcessor.close(),
  ]);

  await Promise.all([
    emailOtpQueue.close(),
    registrationQueue.close(),
    paymentTimeoutQueue.close(),
    notificationQueue.close(),
    studentImportQueue.close(),
  ]);

  await redis.quit();

  process.exit(0);
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
