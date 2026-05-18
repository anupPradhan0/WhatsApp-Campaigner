import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { getRedis, isRedisReady } from "../config/redis.js";

const IN_PROGRESS = "__IN_PROGRESS__";
const KEY_PREFIX = "idem:";
const HEADER = "idempotency-key";
// Idempotency-Key must be a non-empty, reasonably-sized token. We refuse
// obviously bad inputs rather than caching for them.
const MAX_KEY_LEN = 128;
const KEY_RE = /^[A-Za-z0-9_-]+$/;
// Sentinel TTL is intentionally short — long enough for any well-behaved
// handler to finish, short enough that a silent crash (no res.close hook
// fired, e.g. process kill) doesn't lock out the client for the full
// IDEMPOTENCY_TTL_SECONDS window.
const SENTINEL_TTL_SECONDS = 60;

interface CachedResponse {
  status: number;
  body: unknown;
}

function buildKey(userId: string, idempotencyKey: string, route: string): string {
  return `${KEY_PREFIX}${route}:${userId}:${idempotencyKey}`;
}

/**
 * Idempotency middleware. Reads the `Idempotency-Key` request header and
 * caches the first successful (or client-error) response for
 * `IDEMPOTENCY_TTL_SECONDS`. A replay with the same key + same user returns
 * the cached response without re-running the handler.
 *
 * Semantics:
 * - No header → pass through (idempotency is opt-in).
 * - Redis unavailable → pass through (no cache, request still works).
 * - Concurrent replays land on the "in-progress" sentinel and return 409.
 * - Server errors (5xx) are NOT cached so retries can succeed.
 */
export function idempotencyMiddleware(routeLabel: string) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const rawKey = req.header(HEADER);
    if (!rawKey) return next();
    if (rawKey.length > MAX_KEY_LEN || !KEY_RE.test(rawKey)) {
      res.status(400).json({
        success: false,
        message:
          "Invalid Idempotency-Key header. Use up to 128 chars: letters, digits, _ or -.",
      });
      return;
    }

    if (!isRedisReady()) return next();
    const client = getRedis();
    if (!client) return next();

    const userId = req.user?._id?.toString();
    if (!userId) return next(); // unauthenticated → nothing to scope by

    const key = buildKey(userId, rawKey, routeLabel);

    try {
      // SET NX EX — atomic "claim" of the key. Returns "OK" on first writer,
      // null when an existing value (either sentinel or cached body) is there.
      // Sentinel uses a short TTL; the longer IDEMPOTENCY_TTL_SECONDS is only
      // applied once the cached result overwrites this entry.
      const claimed = await client.set(
        key,
        IN_PROGRESS,
        "EX",
        SENTINEL_TTL_SECONDS,
        "NX",
      );

      if (claimed !== "OK") {
        const existing = await client.get(key);
        if (existing === IN_PROGRESS || existing === null) {
          res.status(409).json({
            success: false,
            message:
              "A request with this Idempotency-Key is already in flight. Retry shortly.",
          });
          return;
        }
        try {
          const parsed = JSON.parse(existing) as CachedResponse;
          res.status(parsed.status).json(parsed.body);
          return;
        } catch {
          // Corrupt cache entry — drop it and pass through.
          await client.del(key);
          return next();
        }
      }
    } catch (err) {
      console.warn(
        "[idempotency] Redis claim failed, passing through:",
        (err as Error).message,
      );
      return next();
    }

    // Capture the response so we can cache it after the handler runs.
    const originalJson = res.json.bind(res);
    let captured = false;
    res.json = (body: unknown) => {
      if (!captured) {
        captured = true;
        const status = res.statusCode;
        // Only cache definitive outcomes: 2xx (success) and 4xx (client error,
        // not a transient server problem). 5xx is left uncached so a retry
        // can still succeed.
        if (status >= 200 && status < 500) {
          const cached: CachedResponse = { status, body };
          client
            .set(key, JSON.stringify(cached), "EX", env.IDEMPOTENCY_TTL_SECONDS)
            .catch((err) =>
              console.warn(
                "[idempotency] cache store failed:",
                (err as Error).message,
              ),
            );
        } else {
          // Drop the sentinel so the next retry can attempt fresh.
          client.del(key).catch(() => {
            /* ignore */
          });
        }
      }
      return originalJson(body);
    };

    // If the handler errors out before sending, free the sentinel.
    res.on("close", () => {
      if (!res.headersSent) {
        client.del(key).catch(() => {
          /* ignore */
        });
      }
    });

    next();
  };
}
