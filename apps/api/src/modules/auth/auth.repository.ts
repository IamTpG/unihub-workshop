import { prisma } from "@unihub/db";

export class AuthRepository {
  async findUserByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
    });
  }

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  // OTP Token Methods
  async createOtp(userId: string, hashedCode: string, expiresAt: Date) {
    return prisma.otpToken.create({
      data: {
        userId,
        hashedCode,
        expiresAt,
      },
    });
  }

  async findValidOtp(userId: string) {
    return prisma.otpToken.findFirst({
      where: {
        userId,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async markOtpAsUsed(otpId: string) {
    return prisma.otpToken.update({
      where: { id: otpId },
      data: { isUsed: true },
    });
  }

  async invalidateAllUserOtps(userId: string) {
    return prisma.otpToken.updateMany({
      where: { userId, isUsed: false },
      data: { isUsed: true },
    });
  }

  // Refresh Token Methods
  async createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
  }) {
    return prisma.refreshToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        familyId: data.familyId,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findFirst({
      where: { tokenHash },
    });
  }

  async revokeToken(id: string) {
    return prisma.refreshToken.update({
      where: { id },
      data: { isRevoked: true },
    });
  }

  async revokeTokenFamily(familyId: string) {
    return prisma.refreshToken.updateMany({
      where: { familyId },
      data: { isRevoked: true },
    });
  }
}

export const authRepository = new AuthRepository();
