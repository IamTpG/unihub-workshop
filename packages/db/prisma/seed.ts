import "dotenv/config";
import {
  PrismaClient,
  RegStatus,
  Role,
  WorkshopStatus,
} from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const hour = 60 * 60 * 1000;
const day = 24 * hour;

function addTime(days: number, hours = 0) {
  return new Date(Date.now() + days * day + hours * hour);
}

async function upsertWorkshopByTitle(data: {
  title: string;
  description?: string;
  speakerName?: string;
  location?: string;
  roomLayoutUrl?: string;
  pdfUrl?: string;
  startTime: Date;
  endTime: Date;
  capacity: number;
  price: string;
  status: WorkshopStatus;
  aiSummary?: string;
  registrationOpenAt?: Date;
  registrationCloseAt?: Date;
}) {
  const existing = await prisma.workshop.findFirst({
    where: { title: data.title },
    select: { id: true },
  });

  if (existing) {
    return prisma.workshop.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.workshop.create({
    data: {
      ...data,
      availableSlots: data.capacity,
    },
  });
}

async function syncWorkshopSlots(workshopId: string, capacity: number) {
  const reserved = await prisma.registration.count({
    where: {
      workshopId,
      status: {
        in: [RegStatus.PENDING, RegStatus.HOLDING, RegStatus.PAID],
      },
    },
  });

  await prisma.workshop.update({
    where: { id: workshopId },
    data: { availableSlots: Math.max(capacity - reserved, 0) },
  });
}

async function main() {
  console.log("Starting database seed...");

  console.log("Seeding users...");
  const users = [
    {
      username: "22120001",
      fullName: "Nguyen Van An",
      email: "student1@example.com",
      role: Role.STUDENT,
    },
    {
      username: "22120002",
      fullName: "Tran Thi Binh",
      email: "student2@example.com",
      role: Role.STUDENT,
    },
    {
      username: "22120003",
      fullName: "Le Minh Chau",
      email: "student3@example.com",
      role: Role.STUDENT,
    },
    {
      username: "staff_nguyen",
      fullName: "Nguyen Support",
      email: "staff.nguyen@example.com",
      role: Role.STAFF,
    },
    {
      username: "admin",
      fullName: "System Admin",
      email: "admin@example.com",
      role: Role.ADMIN,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: user,
      create: user,
    });
  }

  console.log("Seeding student roster...");
  const studentRecords = [
    {
      studentId: "22120001",
      email: "student1@example.com",
      fullName: "Nguyen Van An",
      status: "ACTIVE",
    },
    {
      studentId: "22120002",
      email: "student2@example.com",
      fullName: "Tran Thi Binh",
      status: "ACTIVE",
    },
    {
      studentId: "22120003",
      email: "student3@example.com",
      fullName: "Le Minh Chau",
      status: "INACTIVE",
    },
  ];

  for (const record of studentRecords) {
    await prisma.studentRecord.upsert({
      where: { studentId: record.studentId },
      update: record,
      create: record,
    });
  }

  console.log("Seeding workshops...");
  const workshops = [
    {
      title: "CV and Interview Skills",
      description:
        "Practical guidance for writing a focused CV and preparing for junior developer interviews.",
      speakerName: "Dr. Le Nam",
      location: "Room A.202",
      roomLayoutUrl: "https://example.com/layouts/a202.png",
      pdfUrl: "https://example.com/workshops/cv-interview.pdf",
      startTime: addTime(1, 9),
      endTime: addTime(1, 11),
      capacity: 60,
      price: "0",
      status: WorkshopStatus.PUBLISHED,
      aiSummary:
        "This workshop covers CV structure, project storytelling, interview practice, and common junior developer questions.",
      registrationOpenAt: addTime(-2),
      registrationCloseAt: addTime(1, 8),
    },
    {
      title: "Backend Development with Node.js and Prisma",
      description:
        "Build a registration workflow with transactional database updates, queues, and payment timeout handling.",
      speakerName: "Nguyen Backend",
      location: "Hall B",
      startTime: addTime(2, 13),
      endTime: addTime(2, 16),
      capacity: 100,
      price: "50000",
      status: WorkshopStatus.PUBLISHED,
      aiSummary:
        "A hands-on backend session about Prisma transactions, idempotency keys, background workers, and slot consistency.",
      registrationOpenAt: addTime(-1),
      registrationCloseAt: addTime(2, 10),
    },
    {
      title: "Introduction to AI and LLMs",
      description:
        "Learn core AI concepts, prompt design basics, and responsible ways to use large language models in coursework.",
      speakerName: "AI Specialist",
      location: "Lab 1",
      startTime: addTime(3, 8),
      endTime: addTime(3, 12),
      capacity: 40,
      price: "0",
      status: WorkshopStatus.PUBLISHED,
      aiSummary:
        "The session introduces AI terminology, LLM capabilities, limitations, and practical examples for student projects.",
      registrationOpenAt: addTime(-1),
      registrationCloseAt: addTime(3, 7),
    },
    {
      title: "Mobile UI/UX Design",
      description:
        "Design mobile flows that are clear, accessible, and easy to implement with modern frontend tooling.",
      speakerName: "Senior Designer",
      location: "Room D.305",
      startTime: addTime(5, 9),
      endTime: addTime(5, 12),
      capacity: 50,
      price: "25000",
      status: WorkshopStatus.PUBLISHED,
      aiSummary:
        "The workshop focuses on mobile layout, usability testing, component states, and practical design handoff.",
      registrationOpenAt: addTime(1),
      registrationCloseAt: addTime(5, 8),
    },
    {
      title: "Public Speaking and Communication",
      description:
        "Practice structuring a short talk, presenting clearly, and handling audience questions with confidence.",
      speakerName: "Coach Minh Tran",
      location: "Hall C",
      startTime: addTime(7, 14),
      endTime: addTime(7, 16),
      capacity: 120,
      price: "0",
      status: WorkshopStatus.PUBLISHED,
      aiSummary:
        "This session helps students plan concise presentations, use examples well, and answer questions clearly.",
      registrationOpenAt: addTime(-1),
      registrationCloseAt: addTime(7, 12),
    },
    {
      title: "Draft Workshop",
      description: "Internal draft content for admin testing.",
      speakerName: "TBA",
      location: "Room C.101",
      startTime: addTime(10, 9),
      endTime: addTime(10, 11),
      capacity: 30,
      price: "0",
      status: WorkshopStatus.DRAFT,
      aiSummary: "Draft summary visible only to admin workflows.",
      registrationOpenAt: addTime(8),
      registrationCloseAt: addTime(10, 8),
    },
    {
      title: "Cancelled Cloud Lab",
      description: "Cancelled workshop retained for status filtering tests.",
      speakerName: "Cloud Team",
      location: "Lab 2",
      startTime: addTime(4, 9),
      endTime: addTime(4, 11),
      capacity: 25,
      price: "0",
      status: WorkshopStatus.CANCELLED,
      aiSummary: "Cancelled event used to verify that public lists hide cancelled workshops.",
      registrationOpenAt: addTime(-1),
      registrationCloseAt: addTime(4, 8),
    },
  ];

  const workshopByTitle = new Map<string, { id: string; capacity: number }>();

  for (const workshop of workshops) {
    const saved = await upsertWorkshopByTitle(workshop);
    workshopByTitle.set(saved.title, { id: saved.id, capacity: saved.capacity });
  }

  const student1 = await prisma.user.findUniqueOrThrow({
    where: { username: "22120001" },
  });
  const student2 = await prisma.user.findUniqueOrThrow({
    where: { username: "22120002" },
  });
  const staff = await prisma.user.findUniqueOrThrow({
    where: { username: "staff_nguyen" },
  });

  const cvWorkshop = workshopByTitle.get("CV and Interview Skills");
  const backendWorkshop = workshopByTitle.get(
    "Backend Development with Node.js and Prisma",
  );
  const aiWorkshop = workshopByTitle.get("Introduction to AI and LLMs");

  if (!cvWorkshop || !backendWorkshop || !aiWorkshop) {
    throw new Error("Expected seeded workshops were not created");
  }

  console.log("Seeding registrations...");
  const registrations = [
    {
      userId: student1.id,
      workshopId: cvWorkshop.id,
      status: RegStatus.PAID,
      idempotencyKey: "seed-student1-cv",
      paymentRef: null,
      expiresAt: null,
      checkedInAt: null,
    },
    {
      userId: student2.id,
      workshopId: cvWorkshop.id,
      status: RegStatus.PAID,
      idempotencyKey: "seed-student2-cv",
      paymentRef: null,
      expiresAt: addTime(-0.1),
      checkedInAt: addTime(-0.05),
    },
    {
      userId: student1.id,
      workshopId: backendWorkshop.id,
      status: RegStatus.HOLDING,
      idempotencyKey: "seed-student1-backend",
      paymentRef: "mock-intent-seed-001",
      expiresAt: addTime(0, 1),
      checkedInAt: null,
    },
    {
      userId: student2.id,
      workshopId: aiWorkshop.id,
      status: RegStatus.PENDING,
      idempotencyKey: "seed-student2-ai",
      paymentRef: null,
      expiresAt: null,
      checkedInAt: null,
    },
  ];

  for (const registration of registrations) {
    const saved = await prisma.registration.upsert({
      where: {
        userId_workshopId: {
          userId: registration.userId,
          workshopId: registration.workshopId,
        },
      },
      update: registration,
      create: registration,
    });

    if (registration.status === RegStatus.PAID) {
      await prisma.registration.update({
        where: { id: saved.id },
        data: { qrStub: saved.id },
      });
    }
  }

  console.log("Seeding notifications...");
  await prisma.notification.deleteMany({
    where: {
      type: { startsWith: "SEED_" },
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: student1.id,
        type: "SEED_REGISTRATION_CONFIRMED",
        title: "Registration Confirmed",
        body: "Your registration for CV and Interview Skills is confirmed.",
        isRead: false,
      },
      {
        userId: student1.id,
        type: "SEED_PAYMENT_PENDING",
        title: "Payment Pending",
        body: "Your Backend Development seat is held while payment is pending.",
        isRead: false,
      },
      {
        userId: staff.id,
        type: "SEED_ADMIN_NOTICE",
        title: "Seed Data Ready",
        body: "Demo users, workshops, registrations, and student records are available.",
        isRead: true,
      },
    ],
  });

  console.log("Seeding import log sample...");
  await prisma.importLog.deleteMany({
    where: { filename: "seed-students.csv" },
  });

  await prisma.importLog.create({
    data: {
      filename: "seed-students.csv",
      totalRows: studentRecords.length,
      inserted: studentRecords.length,
      updated: 0,
      skipped: 0,
      failed: 0,
      status: "DONE",
    },
  });

  console.log("Synchronizing available slots...");
  for (const workshop of workshopByTitle.values()) {
    await syncWorkshopSlots(workshop.id, workshop.capacity);
  }

  console.log("Database seed completed.");
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
