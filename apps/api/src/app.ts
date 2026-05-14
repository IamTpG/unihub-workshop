import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { responseWrapper } from "./middleware/response.middleware";
import { checkApiKey, authenticate } from "./middleware/auth.middleware";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware";
import { registerRoutes } from "./routes";
// import entityRoutes from "./modules/_template/entity.routes";

const app = express();

// Global Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(responseWrapper);

// Require API Key for all incoming requests (Layer 1)
app.use(checkApiKey);

// Public Domain Routes (Require API Key only)
registerRoutes(app);

// Require User Authentication for all subsequent routes (Layer 2)
app.use(authenticate);

// Mount Protected Domain Routes
// app.use("/api/v1/entity", entityRoutes);

// Global Error Handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
