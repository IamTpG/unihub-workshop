import type { Request, Response } from "express";
import { prisma } from "@unihub/db";
import { redis } from "../../infra/redis/redis.js";

/**
 * SSE Notification Stream Handler
 *
 * Supports the standard `Last-Event-ID` header for reconnect replay: when the
 * browser reconnects after a disconnect, it sends the ID of the last event it
 * received and we immediately flush all notifications created after that point
 * before resuming the live Redis Pub/Sub stream.
 */
export const streamNotifications = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).end();
    return;
  }

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable buffering in Nginx if present

  res.write(": connected\n\n");

  const channel = `notifications:user:${userId}`;

  // -------------------------------------------------------------------------
  // Replay missed notifications (Last-Event-ID reconnect support)
  // -------------------------------------------------------------------------
  const lastEventId =
    req.header("last-event-id") ?? (req.query.lastEventId as string | undefined);
  if (lastEventId) {
    try {
      const missed = await prisma.notification.findMany({
        where: {
          userId,
          id: { gt: lastEventId },
        },
        orderBy: { createdAt: "asc" },
        take: 50,
      });

      for (const notif of missed) {
        const payload = JSON.stringify({
          type: notif.type,
          title: notif.title,
          body: notif.body,
          timestamp: notif.createdAt.toISOString(),
        });
        res.write(`id: ${notif.id}\ndata: ${payload}\n\n`);
      }
    } catch (err) {
      console.error(
        `[SSE] Failed to replay missed notifications for user ${userId}:`,
        err,
      );
    }
  }

  // -------------------------------------------------------------------------
  // Live stream via Redis Pub/Sub
  // -------------------------------------------------------------------------
  const subscriber = redis.duplicate();

  try {
    await subscriber.subscribe(channel);
    console.log(`[SSE] User ${userId} subscribed to ${channel}`);

    subscriber.on("message", (ch, message) => {
      if (ch === channel) {
        try {
          const data = JSON.parse(message) as { id?: string };
          const eventId = data.id ?? "";
          res.write(`${eventId ? `id: ${eventId}\n` : ""}data: ${message}\n\n`);
        } catch {
          res.write(`data: ${message}\n\n`);
        }
      }
    });

    // Keepalive interval to prevent connection timeout
    const keepAlive = setInterval(() => {
      res.write(": keepalive\n\n");
    }, 30000);

    res.on("close", async () => {
      console.log(`[SSE] User ${userId} connection closed`);
      clearInterval(keepAlive);
      try {
        await subscriber.unsubscribe(channel);
        await subscriber.quit();
      } catch (err) {
        console.error("[SSE] Error during subscriber cleanup:", err);
      }
    });
  } catch (error) {
    console.error(`[SSE] Failed to setup subscription for user ${userId}:`, error);
    res.status(500).end();
    await subscriber.quit();
  }
};
