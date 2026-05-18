import { Redis } from "ioredis";
import type { Redis as RedisClient } from "ioredis";
import { env } from "./env.js";

let client: RedisClient | null = null;
let connecting: Promise<void> | null = null;
let intentionalClose = false;

/**
 * Lazy-connecting singleton Redis client.
 *
 * Resilience contract: callers should treat Redis as best-effort. If
 * `isRedisReady()` returns false, fall back to a sensible default
 * (in-memory, fail-open, etc.) rather than rejecting the request.
 */
export function getRedis(): RedisClient | null {
  return client;
}

export function isRedisReady(): boolean {
  return client !== null && client.status === "ready";
}

export async function connectRedis(): Promise<void> {
  if (client) return;
  if (connecting) {
    await connecting;
    return;
  }

  intentionalClose = false;

  connecting = new Promise<void>((resolve) => {
    const c = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      // ioredis already retries with backoff. Capped so we don't sit on stale state forever.
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
      retryStrategy(times: number): number | null {
        if (intentionalClose) return null;
        const delay = Math.min(30_000, 1000 * 2 ** Math.min(times, 5));
        return delay;
      },
    });

    let resolved = false;
    const settle = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };

    c.on("connect", () => {
      console.log("[redis] connected.");
    });
    c.on("ready", () => {
      console.log("[redis] ready.");
      settle();
    });
    c.on("error", (err: Error) => {
      // ioredis emits 'error' on connect failure too — keep this terse to avoid log spam.
      console.warn("[redis] error:", err.message);
      settle();
    });
    c.on("close", () => {
      if (!intentionalClose) console.warn("[redis] connection closed.");
    });
    c.on("reconnecting", (delay: number) => {
      console.log(`[redis] reconnecting in ${delay}ms`);
    });
    c.on("end", () => {
      if (!intentionalClose) console.warn("[redis] connection ended.");
    });

    client = c;

    // Fire the initial connect. Don't await — we want the function to resolve
    // either on 'connect' or first 'error' so the boot path is non-blocking.
    c.connect().catch((err: Error) => {
      console.warn("[redis] initial connect failed:", err.message);
      settle();
    });
  });

  await connecting;
}

export async function disconnectRedis(): Promise<void> {
  intentionalClose = true;
  if (!client) return;
  try {
    await client.quit();
  } catch (err) {
    console.warn("[redis] quit error:", (err as Error).message);
    try {
      client.disconnect();
    } catch {
      // ignore
    }
  }
  client = null;
  connecting = null;
}
