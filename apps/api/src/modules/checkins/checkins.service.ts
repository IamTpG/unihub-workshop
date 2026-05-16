import { checkinsRepository } from "./checkins.repository.js";
import { BadRequestError, NotFoundError } from "../../infra/errors/AppError.js";
import { prisma } from "@unihub/db";

export class CheckinsService {
  async checkInSingle(registrationId: string) {
    const registration = await checkinsRepository.findRegistrationById(registrationId);

    if (!registration) {
      throw new NotFoundError("Registration not found");
    }

    if (registration.checkedInAt) {
      // Idempotent: return success but don't update
      return registration;
    }

    if (registration.status !== "PAID") {
      throw new BadRequestError(
        `Registration status is ${registration.status}, must be PAID to check-in`,
      );
    }

    await checkinsRepository.checkInSingle(registrationId);
    return checkinsRepository.findRegistrationById(registrationId);
  }

  async checkInBatch(
    items: { registrationId: string; checkedInAt?: string | undefined }[],
  ) {
    const ids = items.map((i) => i.registrationId);

    const registrations = await prisma.registration.findMany({
      where: { id: { in: ids } },
      select: { id: true, status: true, checkedInAt: true },
    });

    const regMap = new Map(registrations.map((r) => [r.id, r]));

    const validItems: { registrationId: string; checkedInAt?: string | undefined }[] = [];
    let skippedCount = 0;
    const syncedIds: string[] = [];
    const failedIds: string[] = [];

    for (const item of items) {
      const reg = regMap.get(item.registrationId);

      if (!reg) {
        failedIds.push(item.registrationId);
        continue;
      }

      if (reg.checkedInAt) {
        skippedCount++;
        syncedIds.push(item.registrationId);
        continue;
      }

      if (reg.status !== "PAID") {
        failedIds.push(item.registrationId);
        continue;
      }

      validItems.push(item);
      syncedIds.push(item.registrationId);
    }

    let processedCount = 0;
    if (validItems.length > 0) {
      const results = await checkinsRepository.checkInBatch(validItems);
      processedCount = results.filter((r) => r.success).length;
    }

    return {
      processedCount,
      skippedCount,
      syncedIds,
      failedIds,
    };
  }
}

export const checkinsService = new CheckinsService();
