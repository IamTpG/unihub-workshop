// import { prisma } from "../../config/db"; // Assuming you have a prisma client instance exported somewhere
import type { EntityCreateDTO } from "./entity.schema";
import { prisma } from "../../config/prisma";

export const EntityRepository = {
  async findAll(offset: number, limit: number) {
    // Example Prisma implementation:
    // return prisma.entity.findMany({ skip: offset, take: limit });

    return []; // Mock data
  },

  async countAll() {
    // return prisma.entity.count();
    return 0; // Mock data
  },

  async findById(id: string) {
    // return prisma.entity.findUnique({ where: { id } });
    return null; // Mock data
  },

  async findByName(name: string) {
    // return prisma.entity.findFirst({ where: { name } });
    return null; // Mock data
  },

  async create(data: EntityCreateDTO) {
    // return prisma.entity.create({ data });
    return { id: "123", ...data }; // Mock data
  },
};
