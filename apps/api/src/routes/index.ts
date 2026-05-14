import type { Express } from "express";
import authRoutes from "../modules/auth/auth.routes";

export const registerRoutes = (app: Express) => {
  app.use("/api/v1/auth", authRoutes);
};
