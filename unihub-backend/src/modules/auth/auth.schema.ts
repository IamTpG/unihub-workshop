import { z } from "zod";

export const loginSchema = {
  body: z.object({
    username: z.string().min(1, "Username is required"),
  }),
};

export const verifyOtpSchema = {
  body: z.object({
    username: z.string().min(1, "Username is required"),
    otp: z.string().length(6, "OTP must be 6 digits"),
  }),
};

export type LoginInput = z.infer<typeof loginSchema.body>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema.body>;
