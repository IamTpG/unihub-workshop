import type { NotificationJobData } from "./registration.js";

export type NotificationType = NotificationJobData["type"];

export interface SSENotificationPayload extends NotificationJobData {
  timestamp: string;
}
