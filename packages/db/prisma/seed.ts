import "dotenv/config";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import {
  PrismaClient,
  RegStatus,
  Role,
  WorkshopStatus,
} from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// ── Types for seed.json ────────────────────────────────────────────────────

type DateOffset = { days: number; hours?: number } | null;

interface UserDef   { username: string; fullName: string; email: string }
interface ImportLogDef {
  filename: string; totalRows: number; inserted: number;
  updated: number; skipped: number; failed: number;
  status: string; createdAt: DateOffset;
}
interface WorkshopDef {
  title: string; description: string; speakerName: string;
  location: string; roomLayoutUrl: string; pdfUrl: string;
  startTime: DateOffset; endTime: DateOffset;
  capacity: number; price: string; status: string;
  aiSummary: string | null;
  registrationOpenAt: DateOffset; registrationCloseAt: DateOffset;
}
interface RegistrationDef {
  studentUsername: string; workshopTitle: string;
  status: string; idempotencyKey: string;
  paymentRef: string | null; expiresAt: DateOffset; checkedInAt: DateOffset;
}
interface NotificationDef {
  username: string; type: string; title: string;
  body: string; isRead: boolean; idempotencyKey: string;
}
interface SeedData {
  students:      UserDef[];
  staff:         UserDef[];
  admin:         UserDef[];
  importLogs:    ImportLogDef[];
  workshops:     WorkshopDef[];
  registrations: RegistrationDef[];
  notifications: NotificationDef[];
}

// ── Load seed.json ─────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedData: SeedData = JSON.parse(
  readFileSync(resolve(__dirname, "../../../data/seed.json"), "utf-8"),
);

// ── DB client ──────────────────────────────────────────────────────────────

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ── Helpers ────────────────────────────────────────────────────────────────

const HOUR = 60 * 60 * 1000;
const DAY  = 24 * HOUR;

function resolveDate(offset: DateOffset): Date | null {
  if (!offset) return null;
  return new Date(Date.now() + offset.days * DAY + (offset.hours ?? 0) * HOUR);
}

async function syncSlots(workshopId: string, capacity: number) {
  const reserved = await prisma.registration.count({
    where: {
      workshopId,
      status: { in: [RegStatus.PENDING, RegStatus.HOLDING, RegStatus.PAID] },
    },
  });
  await prisma.workshop.update({
    where: { id: workshopId },
    data:  { availableSlots: Math.max(capacity - reserved, 0) },
  });
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  // 1. WIPE (dependency order — avoids FK constraint errors)
  console.log("Clearing old data...");
  await prisma.registration.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.otpToken.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.importLog.deleteMany({});
  await prisma.studentRecord.deleteMany({});
  await prisma.workshop.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. USERS
  console.log("Seeding users...");
  await prisma.user.createMany({
    data: [
      ...seedData.students.map((u) => ({ ...u, role: Role.STUDENT })),
      ...seedData.staff.map((u)    => ({ ...u, role: Role.STAFF   })),
      ...seedData.admin.map((u)    => ({ ...u, role: Role.ADMIN   })),
    ],
  });

  // Build username → id lookup used by registrations & notifications
  const allUsers = await prisma.user.findMany({ select: { id: true, username: true } });
  const userIdByUsername = new Map(allUsers.map((u) => [u.username, u.id]));

  // 3. STUDENT RECORDS (every student entry here must be a User)
  console.log("Seeding student records...");
  await prisma.studentRecord.createMany({
    data: seedData.students.map((s) => ({
      studentId: s.username,
      email:     s.email,
      fullName:  s.fullName,
      status:    "ACTIVE",
    })),
  });

  // 4. IMPORT LOGS
  console.log("Seeding import logs...");
  await prisma.importLog.createMany({
    data: seedData.importLogs.map((l) => ({
      filename:  l.filename,
      totalRows: l.totalRows,
      inserted:  l.inserted,
      updated:   l.updated,
      skipped:   l.skipped,
      failed:    l.failed,
      status:    l.status,
      createdAt: resolveDate(l.createdAt) ?? new Date(),
    })),
  });

  // 5. WORKSHOPS
  console.log("Seeding workshops...");
  const createdWorkshops = await Promise.all(
    seedData.workshops.map((w) =>
      prisma.workshop.create({
        data: {
          title:               w.title,
          description:         w.description,
          speakerName:         w.speakerName,
          location:            w.location,
          roomLayoutUrl:       w.roomLayoutUrl,
          pdfUrl:              w.pdfUrl,
          startTime:           resolveDate(w.startTime)!,
          endTime:             resolveDate(w.endTime)!,
          capacity:            w.capacity,
          availableSlots:      w.capacity,
          price:               w.price,
          status:              w.status as WorkshopStatus,
          aiSummary:           w.aiSummary,
          registrationOpenAt:  resolveDate(w.registrationOpenAt),
          registrationCloseAt: resolveDate(w.registrationCloseAt),
        },
      }),
    ),
  );

  const workshopIdByTitle = new Map(createdWorkshops.map((w) => [w.title, w.id]));

  // 6. REGISTRATIONS
  console.log("Seeding registrations...");
  for (const r of seedData.registrations) {
    const userId     = userIdByUsername.get(r.studentUsername);
    const workshopId = workshopIdByTitle.get(r.workshopTitle);
    if (!userId)     throw new Error(`Unknown student username: ${r.studentUsername}`);
    if (!workshopId) throw new Error(`Unknown workshop title: ${r.workshopTitle}`);

    const saved = await prisma.registration.create({
      data: {
        userId,
        workshopId,
        status:          r.status as RegStatus,
        idempotencyKey:  r.idempotencyKey,
        paymentRef:      r.paymentRef,
        expiresAt:       resolveDate(r.expiresAt),
        checkedInAt:     resolveDate(r.checkedInAt),
      },
    });

    if (r.status === "PAID") {
      await prisma.registration.update({
        where: { id: saved.id },
        data:  { qrStub: saved.id },
      });
    }
  }

  // 7. SYNC AVAILABLE SLOTS
  console.log("Synchronizing available slots...");
  for (const w of createdWorkshops) {
    await syncSlots(w.id, w.capacity);
  }

  // 8. NOTIFICATIONS
  console.log("Seeding notifications...");
  await prisma.notification.createMany({
    data: seedData.notifications.map((n) => {
      const userId = userIdByUsername.get(n.username);
      if (!userId) throw new Error(`Unknown notification username: ${n.username}`);
      return {
        userId,
        type:           n.type,
        title:          n.title,
        body:           n.body,
        isRead:         n.isRead,
        idempotencyKey: n.idempotencyKey,
      };
    }),
  });

  const { students, staff, admin, workshops, registrations } = seedData;
  console.log("Database seed completed successfully.");
  console.log(`  Users:          ${students.length + staff.length + admin.length}  (${admin.length} ADMIN · ${staff.length} STAFF · ${students.length} STUDENT)`);
  console.log(`  StudentRecords: ${students.length}`);
  console.log(`  ImportLogs:     ${seedData.importLogs.length}`);
  console.log(`  Workshops:      ${workshops.length}  (${workshops.filter((w) => w.status === "DRAFT").length} DRAFT · ${workshops.filter((w) => w.status === "PUBLISHED").length} PUBLISHED · ${workshops.filter((w) => w.status === "HIDDEN").length} HIDDEN · ${workshops.filter((w) => w.status === "CANCELLED").length} CANCELLED)`);
  console.log(`  Registrations:  ${registrations.length}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
