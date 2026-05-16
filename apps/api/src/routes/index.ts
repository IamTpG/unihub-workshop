import type { Express } from "express";
import authRoutes from "../modules/auth/auth.routes";
import adminWorkshopRoutes from "../modules/admin-workshops/admin-workshops.routes";
import workshopRoutes from "../modules/workshops/workshops.routes";
import registrationRoutes from "../modules/registrations/registrations.routes";
import paymentWebhookRoutes from "../modules/registrations/payment-webhook.routes";
import checkinRoutes from "../modules/checkins/checkins.routes.js";
import notificationRoutes from "../modules/notifications/notifications.routes.js";
import studentImportRoutes from "../modules/student-import/student-import.routes.js";
import aiSummaryRoutes from "../modules/ai-summary/ai-summary.routes.js";

export const registerRoutes = (app: Express) => {
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/admin/workshops", aiSummaryRoutes);
  app.use("/api/v1/admin/workshops", adminWorkshopRoutes);
  app.use("/api/v1/workshops", workshopRoutes);
  app.use("/api/v1", registrationRoutes);
  app.use("/api/v1/payments", paymentWebhookRoutes);
  app.use("/api/v1/check-ins", checkinRoutes);
  app.use("/api/v1/notifications", notificationRoutes);
  app.use("/api/v1/admin/import", studentImportRoutes);
};
