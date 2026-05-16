import type { Prisma } from "@unihub/db";
import { NotFoundError } from "../../infra/errors/AppError";
import { adminWorkshopsRepository } from "./admin-workshops.repository";
import type {
  CreateWorkshopInput,
  ListWorkshopsQuery,
  UpdateWorkshopInput,
} from "./admin-workshops.schema";

export class AdminWorkshopsService {
  async create(input: CreateWorkshopInput) {
    const workshop = await adminWorkshopsRepository.create({
      ...this.toWorkshopCreateData(input),
      availableSlots: input.capacity,
    });

    return workshop;
  }

  list(query: ListWorkshopsQuery) {
    return adminWorkshopsRepository.list(query);
  }

  async getById(id: string) {
    const workshop = await adminWorkshopsRepository.findById(id);
    if (!workshop) {
      throw new NotFoundError("Workshop not found");
    }

    return workshop;
  }

  async update(id: string, input: UpdateWorkshopInput) {
    const workshop = await adminWorkshopsRepository.update(
      id,
      this.toWorkshopUpdateData(input),
    );

    if (!workshop) {
      throw new NotFoundError("Workshop not found");
    }

    return workshop;
  }

  async getStats(id: string) {
    const workshop = await adminWorkshopsRepository.findById(id);
    if (!workshop) {
      throw new NotFoundError("Workshop not found");
    }

    const registrationStats = await adminWorkshopsRepository.getRegistrationStats(id);

    return {
      workshop,
      registrationCounts: registrationStats.countsByStatus,
      totalRegistrations: registrationStats.total,
    };
  }

  private toWorkshopCreateData(
    input: CreateWorkshopInput,
  ): Prisma.WorkshopUncheckedCreateInput {
    const data: Prisma.WorkshopUncheckedCreateInput = {
      title: input.title,
      startTime: input.startTime,
      endTime: input.endTime,
      capacity: input.capacity,
      availableSlots: input.capacity,
    };

    this.assignOptionalFields(data, input);
    return data;
  }

  private toWorkshopUpdateData(
    input: UpdateWorkshopInput,
  ): Prisma.WorkshopUncheckedUpdateInput {
    const data: Prisma.WorkshopUncheckedUpdateInput = {};
    this.assignOptionalFields(data, input);
    return data;
  }

  private assignOptionalFields(
    data: Prisma.WorkshopUncheckedCreateInput | Prisma.WorkshopUncheckedUpdateInput,
    input: CreateWorkshopInput | UpdateWorkshopInput,
  ) {
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.speakerName !== undefined) data.speakerName = input.speakerName;
    if (input.location !== undefined) data.location = input.location;
    if (input.roomLayoutUrl !== undefined) data.roomLayoutUrl = input.roomLayoutUrl;
    if (input.pdfUrl !== undefined) data.pdfUrl = input.pdfUrl;
    if (input.startTime !== undefined) data.startTime = input.startTime;
    if (input.endTime !== undefined) data.endTime = input.endTime;
    if (input.capacity !== undefined) data.capacity = input.capacity;
    if (input.price !== undefined) data.price = input.price;
    if (input.status !== undefined) data.status = input.status;
    if (input.registrationOpenAt !== undefined)
      data.registrationOpenAt = input.registrationOpenAt;
    if (input.registrationCloseAt !== undefined)
      data.registrationCloseAt = input.registrationCloseAt;
  }
}

export const adminWorkshopsService = new AdminWorkshopsService();
