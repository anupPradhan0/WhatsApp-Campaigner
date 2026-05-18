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

/**
 * Graceful shutdown: stop accepting HTTP first so in-flight requests can
 * drain (including publishing to the queue), then close MQ, then DB.
 */
function shutdown(server: import("http").Server): void {
  const SHUTDOWN_TIMEOUT_MS = 15_000;
  const forceExit = setTimeout(() => {
    console.error("Shutdown timed out, forcing exit.");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  server.close(async () => {
    try {
      await stopCampaignConsumer();
      await disconnectRabbitMQ();
    } catch (e) {
      console.error("Error closing RabbitMQ:", e);
    }
    try {
      await disconnectDatabase();
    } catch (e) {
      console.error("Error closing MongoDB:", e);
    }
    process.exit(0);
  });
}

async function bootstrap(): Promise<void> {
  startCleanupScheduler();

  try {
    await connectDatabase();

    // Kick off RabbitMQ connection in the background — don't block API boot
    // on broker availability. The producer will return false if a publish
    // happens before the channel is ready (campaigns get marked failed in
    // that small window; logs make it obvious).
    void connectRabbitMQ({
      assertTopology: assertCampaignTopology,
      onReady: env.WORKER_ENABLED ? startCampaignConsumer : undefined,
    }).catch((err) => {
      console.error("[server] RabbitMQ connect chain failed:", err);
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
