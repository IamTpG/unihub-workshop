import { prisma, WorkshopStatus, RegStatus } from "@unihub/db";
import { redis } from "../../infra/redis/redis.js";
import { registrationQueue } from "../../infra/queue/registration.queue.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../infra/errors/AppError.js";
import { registrationsRepository } from "./registrations.repository.js";

const workshopSlotKey = (workshopId: string) => `workshop:${workshopId}:slots`;

export class RegistrationsService {
  async initiateRegistration(
    userId: string,
    workshopId: string,
    idempotencyKey: string,
    userRole: string,
  ) {
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      select: { id: true, status: true, availableSlots: true },
    });

    if (!workshop) {
      throw new NotFoundError("Workshop not found");
    }

    if (workshop.status !== WorkshopStatus.PUBLISHED) {
      throw new BadRequestError("Workshop is not open for registration");
    }

    // STUDENT users must have an ACTIVE StudentRecord before taking a slot.
    if (userRole === "STUDENT") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      const studentRecord = user
        ? await prisma.studentRecord.findUnique({
            where: { email: user.email },
            select: { status: true },
          })
        : null;

      if (!studentRecord || studentRecord.status !== "ACTIVE") {
        throw new ForbiddenError(
          "Your student record is not active. Please contact admin.",
        );
      }
    }

    const slotKey = workshopSlotKey(workshopId);

    // Seed slot counter if not yet in Redis (idempotent NX)
    await redis.set(slotKey, String(workshop.availableSlots), "NX");

    const remaining = await redis.decr(slotKey);

    if (remaining < 0) {
      await redis.incr(slotKey);
      throw new BadRequestError("Workshop Full");
    }

    const job = await registrationQueue.add("register", {
      userId,
      workshopId,
      idempotencyKey,
    });

    return { jobId: job.id };
  }

  async getUserRegistrations(userId: string, statuses?: RegStatus[]) {
    return registrationsRepository.findByUser(userId, statuses);
  }

  async getRegistrationDetails(id: string, userId: string) {
    return registrationsRepository.findOneByUser(id, userId);
  }

  async seedSlots(workshopId: string, availableSlots: number) {
    await redis.set(workshopSlotKey(workshopId), String(availableSlots), "NX");
  }
}

export const registrationsService = new RegistrationsService();
