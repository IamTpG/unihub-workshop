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
      select: {
        id: true,
        status: true,
        availableSlots: true,
        registrationOpenAt: true,
        registrationCloseAt: true,
      },
    });

    if (!workshop) {
      throw new NotFoundError("Workshop not found");
    }

    if (workshop.status !== WorkshopStatus.PUBLISHED) {
      throw new BadRequestError("Workshop is not open for registration");
    }

    const now = new Date();
    if (workshop.registrationOpenAt && now < workshop.registrationOpenAt) {
      throw new BadRequestError("Registration is not open yet");
    }
    if (workshop.registrationCloseAt && now > workshop.registrationCloseAt) {
      throw new BadRequestError("Registration is closed");
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

    // Guard against duplicate registrations before touching Redis.
    // The DB has @@unique([userId, workshopId]) — a second create in the worker
    // would throw P2002, leaving the Redis slot decremented with no compensation.
    const existingReg = await prisma.registration.findFirst({
      where: { userId, workshopId },
      select: { id: true, status: true },
    });
    if (existingReg) {
      const isTerminal =
        existingReg.status === RegStatus.FAILED ||
        existingReg.status === RegStatus.EXPIRED;

      if (isTerminal) {
        // The payment failed or timed out — the slot was already restored by
        // the webhook / timeout processor. Delete the stale record so the
        // student can claim a new seat as if registering for the first time.
        await prisma.registration.delete({ where: { id: existingReg.id } });
        // Fall through to the normal registration path below.
      } else {
        throw new BadRequestError(
          existingReg.status === RegStatus.PAID
            ? "You are already registered for this workshop"
            : "You already have a pending reservation for this workshop",
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

    // Compensate the Redis decrement if enqueue fails — otherwise the slot
    // count would be permanently lost until the next worker restart.
    try {
      const job = await registrationQueue.add("register", {
        userId,
        workshopId,
        idempotencyKey,
      });
      return { jobId: job.id };
    } catch (err) {
      await redis.incr(slotKey);
      throw err;
    }
  }

  async getUserRegistrations(userId: string, statuses?: RegStatus[]) {
    return registrationsRepository.findByUser(userId, statuses);
  }

  async getRegistrationDetails(id: string, userId: string) {
    return registrationsRepository.findOneByUser(id, userId);
  }

  async retryPayment(registrationId: string, userId: string) {
    const registration = await registrationsRepository.findById(registrationId);
    if (!registration || registration.userId !== userId) {
      throw new NotFoundError("Registration not found");
    }
    if (registration.status !== RegStatus.HOLDING || registration.paymentRef !== null) {
      throw new BadRequestError("This registration is not eligible for payment retry");
    }
    // Re-enqueue the job so the processor creates a new payment intent.
    // The processor handles P2002 idempotently: it finds the existing
    // registration and skips to Stage 2 (payment intent creation).
    const job = await registrationQueue.add("register", {
      userId,
      workshopId: registration.workshopId,
      idempotencyKey: registration.idempotencyKey,
    });
    return { jobId: job.id };
  }

  async seedSlots(workshopId: string, availableSlots: number) {
    await redis.set(workshopSlotKey(workshopId), String(availableSlots), "NX");
  }
}

export const registrationsService = new RegistrationsService();
