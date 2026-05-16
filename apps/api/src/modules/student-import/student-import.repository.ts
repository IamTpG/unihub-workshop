import { prisma } from "@unihub/db";

export class StudentImportRepository {
  async createImportLog(filename: string) {
    return prisma.importLog.create({
      data: { filename, totalRows: 0, status: "PENDING" },
    });
  }

  async listRecentLogs(limit = 20) {
    return prisma.importLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}

export const studentImportRepository = new StudentImportRepository();
