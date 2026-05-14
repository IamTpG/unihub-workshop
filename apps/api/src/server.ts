import { env } from "./infra/config/env";
import { prisma } from "@unihub/db";
import { redis } from "./infra/redis/redis";
import app from "./app";

const PORT = env.PORT || 3000;

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log("✓ PostgreSQL connected");

    await redis.ping();
    console.log("✓ Redis connected");

    const server = app.listen(PORT, () => {
      console.log(`UniHub API is running on http://localhost:${PORT}`);
    });

    const gracefulShutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

      server.close(async () => {
        console.log("HTTP server closed. No longer accepting new requests.");

        try {
          await prisma.$disconnect();
          console.log("PostgreSQL disconnected cleanly.");

          await redis.quit();
          console.log("Redis disconnected cleanly.");

          console.log("Graceful shutdown complete. Exiting process.");
          process.exit(0);
        } catch (error) {
          console.error("Error during shutdown:", error);
          process.exit(1);
        }
      });

      // Force shutdown if connections take too long to close (e.g., 10 seconds)
      setTimeout(() => {
        console.error("Could not close connections in time, forcefully shutting down");
        process.exit(1);
      }, 10000);
    };

    // 4. Listen for system interrupt signals
    process.on("SIGINT", () => gracefulShutdown("SIGINT")); // Triggered by Ctrl+C
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM")); // Triggered by Docker/Cloud providers
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

bootstrap();
