import type { Express } from "express";
import authRoutes from "../modules/auth/auth.routes";
import adminWorkshopRoutes from "../modules/admin-workshops/admin-workshops.routes";
import workshopRoutes from "../modules/workshops/workshops.routes";

export const registerRoutes = (app: Express) => {
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/admin/workshops", adminWorkshopRoutes);
  app.use("/api/v1/workshops", workshopRoutes);
};
