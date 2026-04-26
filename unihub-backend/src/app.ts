import express from "express";
import cors from "cors";
import helmet from "helmet";
import { responseWrapper } from "./core/middlewares/response.middleware";
import { checkApiKey } from "./core/middlewares/auth.middleware";
import { notFoundHandler, errorHandler } from "./core/middlewares/error.middleware";
// import entityRoutes from "./modules/_template/entity.routes";

const app = express();

// Global Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Inject Custom Response Wrapper
app.use(responseWrapper);

// Require API Key for all incoming requests
app.use(checkApiKey);

// Mount Domain Routes
// app.use("/api/v1/entity", entityRoutes);

// Global Error Handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
