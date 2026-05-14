import { NotFoundError, ConflictError } from "../../infra/errors/AppError";
import { EntityRepository } from "./entity.repository";
import type { EntityCreateDTO } from "./entity.schema";

export const EntityService = {
  async getAll(offset: number, limit: number) {
    // Ask the repository for data
    const data = await EntityRepository.findAll(offset, limit);
    const total = await EntityRepository.countAll();

    return { data, total, offset, limit };
  },

  async getById(id: string) {
    const entity = await EntityRepository.findById(id);

    if (!entity) {
      throw new NotFoundError("Entity not found");
    }
    return entity;
  },

  async create(data: EntityCreateDTO) {
    // 1. Business Rule: Check for duplicates
    const existingEntity = await EntityRepository.findByName(data.name);

    if (existingEntity) {
      throw new ConflictError("An entity with this name already exists");
    }

    // 2. Business Rule: Calculate or modify data before saving
    const formattedData = {
      ...data,
      name: data.name.trim().toLowerCase(),
    };

    // 3. Ask repository to save
    const newEntity = await EntityRepository.create(formattedData);

    return newEntity;
  },
};
