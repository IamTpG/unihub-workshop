import type { Request, Response, NextFunction, CookieOptions } from "express";
import { authService } from "./auth.service";
import type { LoginInput, VerifyOtpInput } from "./auth.schema";
import { env } from "../../config/env";
import { UnauthorizedError } from "../../core/errors/AppError";

const REFRESH_TOKEN_COOKIE = "refreshToken";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api/v1/auth", // Only send cookie to auth endpoints
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days matching JWT_REFRESH_TTL
};

export class AuthController {
  async login(
    req: Request<Record<string, never>, Record<string, never>, LoginInput>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await authService.login(req.body.username);
      res.ok(result.message);
    } catch (error) {
      next(error);
    }
  }

  async verifyOtp(
    req: Request<Record<string, never>, Record<string, never>, VerifyOtpInput>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { accessToken, refreshToken } = await authService.verifyOtp(
        req.body.username,
        req.body.otp,
      );

      res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions);

      res.ok("Login successful", { accessToken });
    } catch (error) {
      next(error);
    }
  }

  async refresh(
    req: Request<Record<string, never>, Record<string, never>, Record<string, never>>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];

      if (!refreshToken) {
        throw new UnauthorizedError("Refresh token missing");
      }

      const result = await authService.refreshTokens(refreshToken);

      res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, cookieOptions);

      res.ok("Token refreshed", { accessToken: result.accessToken });
    } catch (error) {
      next(error);
    }
  }

  async logout(
    req: Request<Record<string, never>, Record<string, never>, Record<string, never>>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      res.clearCookie(REFRESH_TOKEN_COOKIE, { ...cookieOptions, maxAge: 0 });

      res.ok("Logged out successfully");
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
