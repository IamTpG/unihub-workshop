import type { Request, Response } from "express";
import { redis } from "../../infra/redis/redis.js";

/**
 * SSE Notification Stream Handler
 * Streams real-time notifications to the client using Redis Pub/Sub.
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

  // Send initial connected event or comment
  res.write(": connected\n\n");
  const channel = `notifications:user:${userId}`;

  // Use a dedicated redis client for subscription
  const subscriber = redis.duplicate();

  try {
    await subscriber.subscribe(channel);
    console.log(`[SSE] User ${userId} subscribed to ${channel}`);

    subscriber.on("message", (ch, message) => {
      if (ch === channel) {
        res.write(`data: ${message}\n\n`);
      }
    });

    // Keepalive interval (30 seconds) to prevent connection timeout
    const keepAlive = setInterval(() => {
      res.write(": keepalive\n\n");
    }, 30000);

    // Cleanup on close
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
