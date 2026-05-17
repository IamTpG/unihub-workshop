import { WorkshopStatus, prisma } from "@unihub/db";

const workshopListSelect = {
  id: true,
  title: true,
  speakerName: true,
  location: true,
  startTime: true,
  endTime: true,
  capacity: true,
  availableSlots: true,
  price: true,
  aiSummary: true,
  pdfUrl: true,
  registrationOpenAt: true,
  registrationCloseAt: true,
} as const;

const workshopDetailSelect = {
  id: true,
  title: true,
  speakerName: true,
  location: true,
  startTime: true,
  endTime: true,
  capacity: true,
  price: true,
  description: true,
  roomLayoutUrl: true,
  aiSummary: true,
  pdfUrl: true,
  registrationOpenAt: true,
  registrationCloseAt: true,
} as const;

export interface PaginationInput {
  page: number;
  limit: number;
}

export class WorkshopsRepository {
  listPublished() {
    return prisma.workshop.findMany({
      where: { status: WorkshopStatus.PUBLISHED },
      orderBy: { startTime: "asc" },
      select: workshopListSelect,
    });
  }

  findDetailById(id: string) {
    return prisma.workshop.findFirst({
      where: { id, status: { in: [WorkshopStatus.PUBLISHED] } },
      select: workshopDetailSelect,
    });
  }

  findAvailableSlotsById(id: string) {
    return prisma.workshop.findUnique({
      where: { id },
      select: { availableSlots: true },
    });
  }
}

export const workshopsRepository = new WorkshopsRepository();
