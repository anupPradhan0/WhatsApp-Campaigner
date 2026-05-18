import rateLimit from "express-rate-limit";
import type { RateLimitRequestHandler } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { getRedis, isRedisReady } from "../config/redis.js";

const windowMs = env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000;
const max = env.RATE_LIMIT_MAX_REQUESTS ?? 100;

function limitHitHandler(req: Request, res: Response): void {
  res.status(429).json({
    success: false,
    error: "Rate limit exceeded",
    message: "Too many requests from this IP address",
    retryAfter: (
      req as Request & { rateLimit?: { resetTime?: Date } }
    ).rateLimit?.resetTime,
  });
}

const memoryLimiter: RateLimitRequestHandler = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHitHandler,
});

let redisLimiter: RateLimitRequestHandler | null = null;

function buildRedisLimiter(): RateLimitRequestHandler | null {
  const client = getRedis();
  if (!client) return null;
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: limitHitHandler,
    store: new RedisStore({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sendCommand: (...args: string[]) => (client as any).call(...args),
      prefix: "rl:login:",
    }),
  });
}

/**
 * Login rate limiter. Uses Redis (shared across processes) when available,
 * falls back to per-process in-memory when Redis is down. Switching is
 * transparent — no startup-order coupling.
 *
 * If Redis drops *during* a request (after the ready-check, before the
 * store finishes its INCR), the redis limiter's `next(err)` is intercepted
 * here and we re-dispatch through the memory limiter so the request isn't
 * 500'd.
 */
export const loginLimiter = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (isRedisReady()) {
    if (!redisLimiter) redisLimiter = buildRedisLimiter();
    if (redisLimiter) {
      const limiter = redisLimiter;
      const fallbackOnStoreError: NextFunction = (err?: unknown) => {
        if (err && !res.headersSent) {
          console.warn(
            "[rate-limit] redis store failed mid-request, falling back to memory:",
            (err as Error).message,
          );
          // Force rebuild on next call so a recovered Redis is picked back up.
          redisLimiter = null;
          memoryLimiter(req, res, next);
          return;
        }
        next(err);
      };
      try {
        limiter(req, res, fallbackOnStoreError);
      } catch (err) {
        // Defensive: synchronous throw shouldn't reach here, but if it does
        // we want to degrade rather than crash the request.
        console.warn(
          "[rate-limit] redis dispatch threw, falling back to memory:",
          (err as Error).message,
        );
        redisLimiter = null;
        memoryLimiter(req, res, next);
      }
      return;
    }
  } else if (redisLimiter) {
    // Redis dropped — discard the cached limiter so we rebuild on recovery.
    redisLimiter = null;
  }
  memoryLimiter(req, res, next);
};
