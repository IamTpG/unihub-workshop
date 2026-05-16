import type { Request, Response, NextFunction } from "express";
import { notificationsService } from "./notifications.service.js";

export class NotificationsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = await notificationsService.list(userId);
      return res.ok("Notifications retrieved successfully", data);
    } catch (err) {
      return next(err);
    }
  }

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const notification = await notificationsService.markRead(userId, id);
      return res.ok("Notification marked as read", notification);
    } catch (err) {
      return next(err);
    }
  }

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await notificationsService.markAllRead(userId);
      return res.ok("All notifications marked as read", result);
    } catch (err) {
      return next(err);
    }
  }
}

export const notificationsController = new NotificationsController();
