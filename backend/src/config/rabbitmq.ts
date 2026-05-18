import amqp from "amqplib";
import type { ChannelModel, Channel } from "amqplib";
import { env } from "./env.js";

let connection: ChannelModel | null = null;
let channel: Channel | null = null;
let connecting: Promise<void> | null = null;
let intentionalClose = false;
let topologyAssertor: ((ch: Channel) => Promise<void>) | null = null;
let onChannelReady: ((ch: Channel) => Promise<void>) | null = null;

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30_000;
let reconnectAttempt = 0;

function backoffDelay(): number {
  const delay = Math.min(
    RECONNECT_MAX_MS,
    RECONNECT_BASE_MS * 2 ** reconnectAttempt,
  );
  reconnectAttempt += 1;
  return delay;
}

async function openConnection(): Promise<void> {
  intentionalClose = false;
  try {
    connection = await amqp.connect(env.RABBITMQ_URL);
    channel = await connection.createChannel();
    reconnectAttempt = 0;

    connection.on("error", (err) => {
      console.error("[rabbitmq] connection error:", err.message);
    });

    connection.on("close", () => {
      channel = null;
      connection = null;
      if (intentionalClose) return;
      const delay = backoffDelay();
      console.warn(`[rabbitmq] connection closed, reconnecting in ${delay}ms`);
      setTimeout(() => {
        connecting = openConnection().catch((err) => {
          console.error("[rabbitmq] reconnect failed:", err);
        });
      }, delay);
    });

    if (topologyAssertor) {
      await topologyAssertor(channel);
    }
    if (onChannelReady) {
      await onChannelReady(channel);
    }

    console.log("[rabbitmq] connected.");
  } catch (err) {
    connection = null;
    channel = null;
    const delay = backoffDelay();
    console.error(
      `[rabbitmq] connect failed (${(err as Error).message}), retrying in ${delay}ms`,
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
    return openConnection();
  }
}

/**
 * Connect to RabbitMQ and assert topology. Idempotent.
 * `assertTopology` runs every time a fresh channel is created (initial + reconnects).
 * `onReady` runs after topology is asserted — use this to (re)start consumers.
 */
export async function connectRabbitMQ(opts: {
  assertTopology: (ch: Channel) => Promise<void>;
  onReady?: (ch: Channel) => Promise<void>;
}): Promise<void> {
  topologyAssertor = opts.assertTopology;
  onChannelReady = opts.onReady ?? null;
  if (channel) return;
  if (!connecting) {
    connecting = openConnection();
  }
  await connecting;
}

export function getChannel(): Channel | null {
  return channel;
}

export async function disconnectRabbitMQ(): Promise<void> {
  intentionalClose = true;
  try {
    if (channel) {
      await channel.close();
    }
  } catch (err) {
    console.warn("[rabbitmq] channel close error:", (err as Error).message);
  }
  try {
    if (connection) {
      await connection.close();
    }
  } catch (err) {
    console.warn("[rabbitmq] connection close error:", (err as Error).message);
  }
  channel = null;
  connection = null;
}
