import { prisma } from "@unihub/db";
import { ForbiddenError, NotFoundError } from "../../infra/errors/AppError.js";

const NOTIFICATION_LIST_LIMIT = 20;

export class NotificationsService {
  async list(userId: string) {
    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: NOTIFICATION_LIST_LIMIT,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { items, total, unreadCount };
  }

  async markRead(userId: string, id: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      throw new NotFoundError("Notification not found");
    }

    if (notification.userId !== userId) {
      throw new ForbiddenError("You do not have access to this notification");
    }

    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { updated: result.count };
  }
}

export const notificationsService = new NotificationsService();
