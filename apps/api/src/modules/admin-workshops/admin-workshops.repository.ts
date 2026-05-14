import { RegStatus, prisma } from "@unihub/db";
import type { Prisma } from "@unihub/db";

export interface PaginationInput {
  page: number;
  limit: number;
}

export interface RegistrationStats {
  countsByStatus: Record<RegStatus, number>;
  total: number;
}

export class AdminWorkshopsRepository {
  create(data: Prisma.WorkshopUncheckedCreateInput) {
    return prisma.workshop.create({ data });
  }

  async list({ page, limit }: PaginationInput) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.workshop.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.workshop.count(),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  findById(id: string) {
    return prisma.workshop.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Prisma.WorkshopUncheckedUpdateInput) {
    const workshop = await this.findById(id);
    if (!workshop) return null;

    return prisma.workshop.update({
      where: { id },
      data,
    });
  }

  async getRegistrationStats(workshopId: string): Promise<RegistrationStats> {
    const groupedCounts = await prisma.registration.groupBy({
      by: ["status"],
      where: { workshopId },
      _count: {
        _all: true,
      },
    });

    const countsByStatus = Object.values(RegStatus).reduce(
      (counts, status) => {
        counts[status] = 0;
        return counts;
      },
      {} as Record<RegStatus, number>,
    );

    for (const row of groupedCounts) {
      countsByStatus[row.status] = row._count._all;
    }

    return {
      countsByStatus,
      total: groupedCounts.reduce((sum, row) => sum + row._count._all, 0),
    };
  }
}

export const adminWorkshopsRepository = new AdminWorkshopsRepository();
