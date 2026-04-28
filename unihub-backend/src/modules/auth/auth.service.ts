import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { authRepository } from "./auth.repository";
import { emailService } from "../../core/utils/email.util";
import * as jwtUtils from "../../core/utils/jwt.util";
import { env } from "../../config/env";
import { redis } from "../../config/redis";
import { AppError, TooManyRequestsError } from "../../core/errors/AppError";
import type { Role } from "../../../generated/prisma";

export class AuthService {
  async login(username: string) {
    const user = await authRepository.findUserByUsername(username);

    // Anti-enumeration: if user doesn't exist, we still simulate the work
    // but don't actually create or send anything.
    if (!user) {
      // Simulate hashing delay even for non-existent users
      await bcrypt.genSalt(10);
      return { message: "OTP sent to your registered email if the account exists" };
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
