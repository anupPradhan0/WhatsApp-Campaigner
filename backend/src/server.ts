import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import {
  connectRabbitMQ,
  disconnectRabbitMQ,
} from "./config/rabbitmq.js";
import { assertCampaignTopology } from "./queue/topology.js";
import {
  startCampaignConsumer,
  stopCampaignConsumer,
} from "./queue/campaign.consumer.js";
import { startCleanupScheduler } from "./jobs/cleanup-scheduler.job.js";
import { startCleanupJob } from "./jobs/cleanup.job.js";

const PORT = env.PORT;

async function shutdown(
  server: import("http").Server,
): Promise<void> {
  await stopCampaignConsumer();
  await disconnectRabbitMQ();
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

    await connectRabbitMQ({
      assertTopology: assertCampaignTopology,
      onReady: env.WORKER_ENABLED ? startCampaignConsumer : undefined,
    });

    const app = createApp();
    const server = app.listen(PORT, () => {
      console.log(`Server listening at http://localhost:${PORT}`);
      console.log(
        env.WORKER_ENABLED
          ? "[server] in-process worker enabled (WORKER_ENABLED=true)"
          : "[server] worker disabled (WORKER_ENABLED=false) — producer-only",
      );
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
      void shutdown(server);
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
