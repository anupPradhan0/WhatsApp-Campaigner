import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { startCleanupScheduler } from "./jobs/cleanup-scheduler.job.js";
import { startCleanupJob } from "./jobs/cleanup.job.js";

const PORT = env.PORT;

function shutdown(server: import("http").Server): void {
  server.close(async () => {
    try {
      await disconnectDatabase();
    } catch (e: unknown) {
      console.error("Error closing MongoDB:", e);
    }
    process.exit(0);
  });
}

async function bootstrap(): Promise<void> {
  startCleanupScheduler();

  try {
    await connectDatabase();
    const app = createApp();
    const server = app.listen(PORT, () => {
      console.log(`Server listening at http://localhost:${PORT}`);
      startCleanupJob();
    });

    server.on("error", (error: Error) => {
      console.error("Server error:", error);
    });

    let shuttingDown = false;
    const onSignal = (signal: string) => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.log(`${signal} received, closing server…`);
      shutdown(server);
    };
    process.on("SIGINT", () => onSignal("SIGINT"));
    process.on("SIGTERM", () => onSignal("SIGTERM"));
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Failed to start:", error.message);
    } else {
      console.error("Failed to start:", error);
    }
    process.exit(1);
  }
}

void bootstrap();
