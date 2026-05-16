import { redis } from "../../infra/redis/redis";
import { NotFoundError } from "../../infra/errors/AppError";
import { workshopsRepository } from "./workshops.repository";
import type { ListWorkshopsQuery } from "./workshops.schema";

type PublishedWorkshopListItem = Awaited<
  ReturnType<typeof workshopsRepository.listPublished>
>[number];
type WorkshopDetail = NonNullable<
  Awaited<ReturnType<typeof workshopsRepository.findDetailById>>
>;

const PUBLISHED_WORKSHOPS_TTL_SECONDS = 300;
const PUBLISHED_WORKSHOPS_CACHE_KEY = "workshops:published";
const WORKSHOP_DETAIL_TTL_SECONDS = 300;

const workshopDetailCacheKey = (workshopId: string) => `workshop:${workshopId}:detail`;
const workshopSlotsCacheKey = (workshopId: string) => `workshop:${workshopId}:slots`;

export class WorkshopsService {
  async listPublished(query: ListWorkshopsQuery) {
    const workshops = await this.getPublishedWorkshops();
    const enrichedWorkshops = await this.withLiveAvailability(workshops);
    const total = enrichedWorkshops.length;
    const start = (query.page - 1) * query.limit;
    const items = enrichedWorkshops
      .slice(start, start + query.limit)
      .map((workshop) => this.toStudentListItem(workshop));

    return {
      items,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getDetail(id: string) {
    const workshop = await this.getDetailMetadata(id);
    const liveSlots = await this.getAvailability(id);

    return {
      ...this.toStudentDetail(workshop),
      availableSlots: liveSlots.availableSlots,
    };
  }

  async getAvailability(id: string) {
    const cacheKey = workshopSlotsCacheKey(id);
    const cachedSlots = await this.readStringCache(cacheKey);

    if (cachedSlots !== null) {
      return { availableSlots: Number(cachedSlots) };
    }

    const workshop = await workshopsRepository.findAvailableSlotsById(id);
    if (!workshop) {
      throw new NotFoundError("Workshop not found");
    }

    await this.writeCache(cacheKey, String(workshop.availableSlots));

    return { availableSlots: workshop.availableSlots };
  }

  private async getPublishedWorkshops(): Promise<PublishedWorkshopListItem[]> {
    const cached = await this.readJsonCache<PublishedWorkshopListItem[]>(
      PUBLISHED_WORKSHOPS_CACHE_KEY,
    );
    if (cached) {
      return cached;
    }

    const workshops = await workshopsRepository.listPublished();
    await this.writeCache(
      PUBLISHED_WORKSHOPS_CACHE_KEY,
      JSON.stringify(workshops),
      PUBLISHED_WORKSHOPS_TTL_SECONDS,
    );

    return workshops;
  }

  private async getDetailMetadata(id: string): Promise<WorkshopDetail> {
    const cacheKey = workshopDetailCacheKey(id);
    const cached = await this.readJsonCache<WorkshopDetail>(cacheKey);
    if (cached) {
      return cached;
    }

    const workshop = await workshopsRepository.findDetailById(id);
    if (!workshop) {
      throw new NotFoundError("Workshop not found");
    }

    await this.writeCache(
      cacheKey,
      JSON.stringify(workshop),
      WORKSHOP_DETAIL_TTL_SECONDS,
    );

    return workshop;
  }

  private async withLiveAvailability(workshops: PublishedWorkshopListItem[]) {
    if (workshops.length === 0) {
      return workshops;
    }

    try {
      const slotKeys = workshops.map((workshop) => workshopSlotsCacheKey(workshop.id));
      const cachedSlots = await redis.mget(...slotKeys);

      return workshops.map((workshop, index) => ({
        ...workshop,
        availableSlots:
          cachedSlots[index] === null
            ? workshop.availableSlots
            : Number(cachedSlots[index]),
      }));
    } catch {
      return workshops;
    }
  }

  private toStudentListItem(workshop: PublishedWorkshopListItem) {
    const { pdfUrl, ...safeWorkshop } = workshop;
    return {
      ...safeWorkshop,
      hasPdf: Boolean(pdfUrl),
    };
  }

  private toStudentDetail(workshop: WorkshopDetail) {
    const { pdfUrl, ...safeWorkshop } = workshop;
    return {
      ...safeWorkshop,
      hasPdf: Boolean(pdfUrl),
    };
  }

  private async readJsonCache<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key);
      if (!cached) return null;

      return JSON.parse(cached) as T;
    } catch {
      return null;
    }
  }

  private async readStringCache(key: string): Promise<string | null> {
    try {
      return await redis.get(key);
    } catch {
      return null;
    }
  }

  private async writeCache(key: string, value: string, ttlSeconds?: number) {
    try {
      if (ttlSeconds) {
        await redis.set(key, value, "EX", ttlSeconds);
        return;
      }

      await redis.set(key, value);
    } catch {
      // Redis write failures should not fail student read endpoints.
    }
  }
}

export const workshopsService = new WorkshopsService();
