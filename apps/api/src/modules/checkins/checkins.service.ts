import { checkinsRepository } from "./checkins.repository.js";
import { BadRequestError, NotFoundError } from "../../infra/errors/AppError.js";
import { prisma } from "@unihub/db";
import type { VerifyCheckInInput } from "./checkins.schema.js";

type CheckInVerifyStatus =
  | "CHECKED_IN"
  | "ALREADY_CHECKED_IN"
  | "INVALID_QR"
  | "WRONG_WORKSHOP"
  | "NOT_CONFIRMED";

interface CheckInVerifyResult {
  success: boolean;
  status: CheckInVerifyStatus;
  message: string;
  studentName?: string;
  workshopTitle?: string;
  checkedInAt?: string;
}

const registrationDisplayName = (
  registration: Awaited<ReturnType<typeof checkinsRepository.findRegistrationByQrStub>>,
) => {
  if (!registration) return "Attendee";
  return (
    registration.user.fullName ?? registration.user.email ?? registration.user.username
  );
};

export class CheckinsService {
  async verifyCheckIn(input: VerifyCheckInInput): Promise<CheckInVerifyResult> {
    const registration = await checkinsRepository.findRegistrationByQrStub(input.qrToken);

    if (!registration) {
      return {
        success: false,
        status: "INVALID_QR",
        message: "QR code not recognized",
      };
    }

    const studentName = registrationDisplayName(registration);
    const workshopTitle = registration.workshop.title;

    if (input.workshopId && registration.workshopId !== input.workshopId) {
      return {
        success: false,
        status: "WRONG_WORKSHOP",
        message: "Ticket is for a different workshop",
        studentName,
        workshopTitle,
      };
    }

    if (registration.checkedInAt) {
      return {
        success: true,
        status: "ALREADY_CHECKED_IN",
        message: `Already checked in at ${registration.checkedInAt.toISOString()}`,
        studentName,
        workshopTitle,
        checkedInAt: registration.checkedInAt.toISOString(),
      };
    }

    if (registration.status !== "PAID") {
      return {
        success: false,
        status: "NOT_CONFIRMED",
        message: `Registration not confirmed (status: ${registration.status})`,
        studentName,
        workshopTitle,
      };
    }

    const checkedInAt = new Date();
    const updated = await checkinsRepository.checkInSingle(registration.id, checkedInAt);

    if (!updated) {
      const latest = await checkinsRepository.findRegistrationById(registration.id);
      const latestCheckedInAt = latest?.checkedInAt ?? checkedInAt;
      return {
        success: true,
        status: "ALREADY_CHECKED_IN",
        message: `Already checked in at ${latestCheckedInAt.toISOString()}`,
        studentName,
        workshopTitle,
        checkedInAt: latestCheckedInAt.toISOString(),
      };
    }

    return {
      success: true,
      status: "CHECKED_IN",
      message: "Check-in successful",
      studentName,
      workshopTitle,
      checkedInAt: checkedInAt.toISOString(),
    };
  }

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
