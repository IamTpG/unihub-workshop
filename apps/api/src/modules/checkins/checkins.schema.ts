import { z } from "zod";

export const checkInParamsSchema = z.object({
  registrationId: z.string().uuid("Invalid registration ID"),
});

export const verifyCheckInSchema = z.object({
  qrToken: z.string().trim().min(1, "QR token is required"),
  workshopId: z.string().uuid("Invalid workshop ID").optional(),
});

export const batchCheckInItemSchema = z.object({
  registrationId: z.string().uuid("Invalid registration ID"),
  checkedInAt: z.string().datetime().optional(),
});

export const batchCheckInSchema = z.object({
  items: z.array(batchCheckInItemSchema).max(100, "Batch size exceeds maximum of 100"),
});

export type VerifyCheckInInput = z.infer<typeof verifyCheckInSchema>;
export type BatchCheckInInput = z.infer<typeof batchCheckInSchema>;
