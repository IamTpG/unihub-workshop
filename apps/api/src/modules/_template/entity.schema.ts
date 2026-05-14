import { z } from "zod";

// Schema for fetching a list of entities
export const EntityGetAllSchema = z.object({
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 10)),
});

// Schema for fetching a single entity by ID
export const EntityIdSchema = z.object({
  id: z.string({ message: "ID is required" }),
});

// Schema for creating a new entity
export const EntityCreateSchema = z.object({
  name: z.string({ message: "Name is required" }).min(2),
  description: z.string().optional(),
  // Add other standard fields here...
});

// 3. Export TypeScript types derived from Zod for the Service layer
export type EntityCreateDTO = z.infer<typeof EntityCreateSchema>;
