import "dotenv/config";
import {
  PrismaClient,
  Role,
  WorkshopStatus,
  RegStatus,
} from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Starting seeding process...");

  // --- 1. Seed Users ---
  console.log("👥 Seeding users...");
  const users = [
    {
      username: "22120001",
      fullName: "Student One",
      email: "student1@example.com",
      role: Role.STUDENT,
    },
    {
      username: "22120002",
      fullName: "Student Two",
      email: "student2@example.com",
      role: Role.STUDENT,
    },
    {
      username: "staff_nguyen",
      fullName: "Staff Nguyen",
      email: "staff.nguyen@example.com",
      role: Role.STAFF,
    },
    {
      username: "admin_admin",
      fullName: "System Admin",
      email: "admin@example.com",
      role: Role.ADMIN,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: u,
    });
  }

  // Lấy ra IDs để dùng cho seeding Registration sau này
  const student1 = await prisma.user.findUnique({
    where: { username: "22120001" },
  });
  const student2 = await prisma.user.findUnique({
    where: { username: "22120002" },
  });

  // --- 2. Seed Workshops ---
  console.log("🏫 Seeding workshops...");
  const now = new Date();

  const workshops = [
    {
      title: "Kỹ năng viết CV và Phỏng vấn",
      description:
        "Hướng dẫn cách viết CV chuyên nghiệp cho sinh viên IT mới ra trường.",
      speakerName: "Dr. Lê Nam",
      location: "Phòng A.202",
      startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Ngày mai
      endTime: new Date(now.getTime() + 26 * 60 * 60 * 1000),
      capacity: 60,
      availableSlots: 60,
      price: 0,
      status: WorkshopStatus.PUBLISHED,
      aiSummary:
        "Tóm tắt: Buổi workshop tập trung vào cấu trúc CV, cách nhấn mạnh kỹ năng và các câu hỏi phỏng vấn phổ biến.",
    },
    {
      title: "Lập trình Backend với Node.js & Prisma",
      description:
        "Workshop chuyên sâu về xây dựng kiến trúc hệ thống chịu tải cao.",
      speakerName: "Nguyễn Vibe Coder",
      location: "Hội trường B",
      startTime: new Date(now.getTime() + 48 * 60 * 60 * 1000), // 2 ngày tới
      endTime: new Date(now.getTime() + 52 * 60 * 60 * 1000),
      capacity: 100,
      availableSlots: 100,
      price: 50000, // Workshop có phí
      status: WorkshopStatus.PUBLISHED,
    },
    {
      title: "Workshop bí mật (Draft)",
      description: "Nội dung chưa công bố.",
      speakerName: "Ẩn danh",
      location: "Phòng C.101",
      startTime: new Date(now.getTime() + 72 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 74 * 60 * 60 * 1000),
      capacity: 30,
      availableSlots: 30,
      price: 0,
      status: WorkshopStatus.DRAFT,
    },
    {
      title: "Nhập môn Trí tuệ Nhân tạo & LLMs",
      description: "Khám phá thế giới AI, từ cơ bản đến cách sử dụng các mô hình ngôn ngữ lớn như GPT.",
      speakerName: "AI Specialist",
      location: "Phòng Lab 1",
      startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      capacity: 40,
      availableSlots: 40,
      price: 0,
      status: WorkshopStatus.PUBLISHED,
    },
    {
      title: "Thiết kế UI/UX cho ứng dụng Mobile",
      description: "Học cách tạo ra trải nghiệm người dùng tuyệt vời và giao diện bắt mắt cho điện thoại.",
      speakerName: "Senior Designer",
      location: "Phòng D.305",
      startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      capacity: 50,
      availableSlots: 50,
      price: 25000,
      status: WorkshopStatus.PUBLISHED,
    },
    {
      title: "Kỹ năng Thuyết trình & Giao tiếp",
      description: "Làm sao để tự tin nói trước đám đông và truyền tải thông điệp hiệu quả.",
      speakerName: "Coach Minh Trần",
      location: "Hội trường C",
      startTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      capacity: 120,
      availableSlots: 120,
      price: 0,
      status: WorkshopStatus.PUBLISHED,
    },
  ];

  for (const w of workshops) {
    await prisma.workshop.upsert({
      where: {
        // Vì Workshop chưa có trường unique cố định, ta dùng title để check (chỉ dùng cho seed)
        id:
          (await prisma.workshop.findFirst({ where: { title: w.title } }))
            ?.id || "00000000-0000-0000-0000-000000000000",
      },
      update: {},
      create: w,
    });
  }

  // --- 3. Seed Registrations (Mẫu) ---
  console.log("📝 Seeding registrations...");
  const ws1 = await prisma.workshop.findFirst({
    where: { title: "Kỹ năng viết CV và Phỏng vấn" },
  });

  if (student1 && ws1) {
    const reg = await prisma.registration.upsert({
      where: { userId_workshopId: { userId: student1.id, workshopId: ws1.id } },
      update: {
        status: RegStatus.PAID,
      },
      create: {
        userId: student1.id,
        workshopId: ws1.id,
        status: RegStatus.PAID,
        idempotencyKey: "seed-key-1",
        checkedInAt: null,
      },
    });

    // Cập nhật qrStub bằng chính ID của registration
    await prisma.registration.update({
      where: { id: reg.id },
      data: { qrStub: reg.id }
    });

    // Sau khi seed 1 registration, cập nhật lại availableSlots
    await prisma.workshop.update({
      where: { id: ws1.id },
      data: { availableSlots: { decrement: 1 } },
    });
  }

  console.log("✅ Seeding complete! Database is ready.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
