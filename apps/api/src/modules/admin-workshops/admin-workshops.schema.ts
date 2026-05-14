import { z } from "zod";
import { WorkshopStatus } from "@unihub/db";

const optionalUrlString = z.string().url().optional();

export const workshopIdParamsSchema = z.object({
  id: z.uuid(),
});

export const listWorkshopsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

const workshopRawShape = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  speakerName: z.string().trim().min(1).optional(),
  location: z.string().trim().min(1).optional(),
  roomLayoutUrl: optionalUrlString,
  pdfUrl: optionalUrlString,
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  capacity: z.coerce.number().int().positive(),
  price: z.coerce.number().nonnegative().optional(),
  status: z.nativeEnum(WorkshopStatus).optional(),
});

export const createWorkshopSchema = workshopRawShape.refine(
  (data) => data.endTime > data.startTime,
  {
    path: ["endTime"],
    message: "endTime must be after startTime",
  },
);

export const updateWorkshopSchema = workshopRawShape
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  })
  .refine(
    (data) => {
      // Chỉ kiểm tra nếu cả 2 cùng tồn tại trong request update
      if (!data.startTime || !data.endTime) return true;
      return data.endTime > data.startTime;
    },
    {
      path: ["endTime"],
      message: "endTime must be after startTime",
    },
  );

export type WorkshopIdParams = z.infer<typeof workshopIdParamsSchema>;
export type ListWorkshopsQuery = z.infer<typeof listWorkshopsQuerySchema>;
export type CreateWorkshopInput = z.infer<typeof createWorkshopSchema>;
export type UpdateWorkshopInput = z.infer<typeof updateWorkshopSchema>;
