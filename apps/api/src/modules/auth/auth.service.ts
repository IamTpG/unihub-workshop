import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@unihub/db";
import { authRepository } from "./auth.repository";
import { emailService } from "../../infra/mail/email.service";
import * as jwtUtils from "../../infra/auth/jwt";
import { env } from "../../infra/config/env";
import { redis } from "../../infra/redis/redis";
import {
  AppError,
  ForbiddenError,
  TooManyRequestsError,
} from "../../infra/errors/AppError";
import type { Role } from "@unihub/db";

export class AuthService {
  async login(username: string) {
    let user = await authRepository.findUserByUsername(username);

    if (!user) {
      // No User account yet — check if a StudentRecord exists for this studentId.
      const studentRecord = await prisma.studentRecord.findUnique({
        where: { studentId: username },
      });

      if (!studentRecord || studentRecord.status !== "ACTIVE") {
        // Anti-enumeration: simulate bcrypt work before returning.
        await bcrypt.genSalt(10);
        return { message: "OTP sent to your registered email if the account exists" };
      }

      // First login: auto-create the User from the StudentRecord.
      user = await authRepository.createUser({
        username: studentRecord.studentId,
        email: studentRecord.email,
        fullName: studentRecord.fullName,
      });
    } else if (user.role === "STUDENT") {
      // Existing STUDENT account: confirm the StudentRecord is still ACTIVE.
      const studentRecord = await prisma.studentRecord.findUnique({
        where: { email: user.email },
        select: { status: true },
      });
      if (!studentRecord || studentRecord.status !== "ACTIVE") {
        throw new ForbiddenError("Student record not found. Please contact admin.");
      }
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + env.OTP_TTL * 1000);

    // Invalidate old OTPs and create new one
    await authRepository.invalidateAllUserOtps(user.id);
    await authRepository.createOtp(user.id, otpHash, expiresAt);

    // Send email
    await emailService.sendOtpEmail(user.email, otp);

    return { message: "OTP sent to your registered email if the account exists" };
  }

  async verifyOtp(username: string, otp: string) {
    const user = await authRepository.findUserByUsername(username);
    if (!user) {
      throw new AppError("Invalid or expired OTP", 401);
    }

    // Rate limit: 5 attempts per username per 10-minute window
    const rateLimitKey = `otp_attempts:${username}`;
    const attempts = await redis.incr(rateLimitKey);

    // Set TTL on first attempt (10-minute window)
    if (attempts === 1) {
      await redis.expire(rateLimitKey, env.OTP_TTL);
    }

    if (attempts > env.OTP_MAX_ATTEMPTS) {
      throw new TooManyRequestsError("Too many OTP attempts. Please request a new OTP.");
    }

    const validOtp = await authRepository.findValidOtp(user.id);
    if (!validOtp) {
      throw new AppError("Invalid or expired OTP", 401);
    }

    const isMatch = await bcrypt.compare(otp, validOtp.hashedCode);
    if (!isMatch) {
      throw new AppError("Invalid or expired OTP", 401);
    }

    // Mark as used and clear rate limit counter
    await authRepository.markOtpAsUsed(validOtp.id);
    await redis.del(rateLimitKey);

    // Issue tokens
    return this.issueTokenPair(user.id, user.role as Role);
  }

  async refreshTokens(refreshToken: string) {
    const tokenHash = jwtUtils.hashToken(refreshToken);
    const tokenRecord = await authRepository.findRefreshTokenByHash(tokenHash);

    if (!tokenRecord) {
      throw new AppError("Invalid refresh token", 401);
    }

    // Theft detection: if already revoked, kill the whole family
    if (tokenRecord.isRevoked) {
      await authRepository.revokeTokenFamily(tokenRecord.familyId);
      throw new AppError("Security alert: session revoked. Please log in again.", 401);
    }

    // Check expiration
    if (new Date() > tokenRecord.expiresAt) {
      throw new AppError("Refresh token expired. Please log in again.", 401);
    }

    // Consume old token
    await authRepository.revokeToken(tokenRecord.id);

    // Issue new pair in same family
    const user = await authRepository.findUserById(tokenRecord.userId);
    if (!user) throw new AppError("User not found", 401);

    return this.issueTokenPair(user.id, user.role as Role, tokenRecord.familyId);
  }

  async logout(refreshToken: string) {
    const tokenHash = jwtUtils.hashToken(refreshToken);
    const tokenRecord = await authRepository.findRefreshTokenByHash(tokenHash);

    if (tokenRecord) {
      await authRepository.revokeTokenFamily(tokenRecord.familyId);
    }

    return { message: "Logged out successfully" };
  }

  private async issueTokenPair(userId: string, role: Role, familyId?: string) {
    const accessToken = jwtUtils.signAccessToken({ sub: userId, role });
    const refreshToken = jwtUtils.generateRefreshToken();
    const tokenHash = jwtUtils.hashToken(refreshToken);

    const fid = familyId || uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await authRepository.createRefreshToken({
      userId,
      tokenHash,
      familyId: fid,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
