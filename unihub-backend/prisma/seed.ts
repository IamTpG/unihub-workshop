import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding test users...");

  const students = [
    {
      username: "22120001",
      fullName: "Student One",
      email: "student1@example.com",
      role: "STUDENT" as const,
    },
    {
      username: "22120002",
      fullName: "Student Two",
      email: "student2@example.com",
      role: "STUDENT" as const,
    },
  ];

  const staff = [
    {
      username: "staff_nguyen",
      fullName: "Staff Nguyen",
      email: "staff.nguyen@example.com",
      role: "STAFF" as const,
    },
  ];

  const admin = [
    {
      username: "admin_admin",
      fullName: "System Admin",
      email: "admin@example.com",
      role: "ADMIN" as const,
    },
  ];

  for (const u of [...students, ...staff, ...admin]) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: u,
    });
  }

  console.log("Seeding complete! ✓");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
