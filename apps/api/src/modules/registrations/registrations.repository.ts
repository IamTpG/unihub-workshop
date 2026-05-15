import { prisma, RegStatus } from "@unihub/db";

export class RegistrationsRepository {
  createPending(userId: string, workshopId: string, idempotencyKey: string) {
    return prisma.registration.create({
      data: { userId, workshopId, idempotencyKey, status: RegStatus.PENDING },
    });
  }

  updateStatus(
    id: string,
    status: RegStatus,
    extra?: { paymentRef?: string; qrStub?: string; expiresAt?: Date },
  ) {
    return prisma.registration.update({
      where: { id },
      data: { status, ...extra },
    });
  }

  findByIntentId(paymentRef: string) {
    return prisma.registration.findFirst({
      where: { paymentRef },
      include: { workshop: { select: { id: true, price: true } } },
    });
  }

  findByUserAndWorkshop(userId: string, workshopId: string) {
    return prisma.registration.findUnique({
      where: { userId_workshopId: { userId, workshopId } },
    });
  }

  findById(id: string) {
    return prisma.registration.findUnique({
      where: { id },
      include: { workshop: { select: { id: true, price: true } } },
    });
  }

  releaseSlot(workshopId: string) {
    return prisma.workshop.update({
      where: { id: workshopId },
      data: { availableSlots: { increment: 1 } },
    });
  }

  atomicDecrementSlot(workshopId: string) {
    return prisma.$executeRaw`
      UPDATE workshops
      SET available_slots = available_slots - 1
      WHERE id = ${workshopId}::uuid
        AND available_slots > 0
    `;
  }
}

export const registrationsRepository = new RegistrationsRepository();
