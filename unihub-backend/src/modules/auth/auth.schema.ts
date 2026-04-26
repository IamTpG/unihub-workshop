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

// Refresh no longer needs a body, token comes from cookie
export const refreshSchema = {
  body: z.object({}),
};

// Logout no longer needs a body, token comes from cookie
export const logoutSchema = {
  body: z.object({}),
};

export type LoginInput = z.infer<typeof loginSchema.body>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema.body>;
export type RefreshInput = z.infer<typeof refreshSchema.body>;
export type LogoutInput = z.infer<typeof logoutSchema.body>;
