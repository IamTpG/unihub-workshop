import { prisma } from "@unihub/db";

export class CheckinsRepository {
  async checkInSingle(registrationId: string, checkedInAt?: Date) {
    const result = await prisma.registration.updateMany({
      where: {
        id: registrationId,
        checkedInAt: null,
        status: "PAID",
      },
      data: {
        checkedInAt: checkedInAt || new Date(),
      },
    });

    return result.count > 0;
  }

  async checkInBatch(
    items: { registrationId: string; checkedInAt?: string | undefined }[],
  ) {
    return prisma.$transaction(async (tx) => {
      const results = await Promise.all(
        items.map(async (item) => {
          const updateResult = await tx.registration.updateMany({
            where: {
              id: item.registrationId,
              checkedInAt: null,
              status: "PAID",
            },
            data: {
              checkedInAt: item.checkedInAt ? new Date(item.checkedInAt) : new Date(),
            },
          });

          return {
            registrationId: item.registrationId,
            success: updateResult.count > 0,
          };
        }),
      );

      return results;
    });
  }

  async findRegistrationById(id: string) {
    return prisma.registration.findUnique({
      where: { id },
      include: { workshop: true },
    });
  }
}

export const checkinsRepository = new CheckinsRepository();
