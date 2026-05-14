import { z } from "zod";

export const workshopIdParamsSchema = z.object({
  id: z.uuid(),
});

export const listWorkshopsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type WorkshopIdParams = z.infer<typeof workshopIdParamsSchema>;
export type ListWorkshopsQuery = z.infer<typeof listWorkshopsQuerySchema>;
