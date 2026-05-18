import crypto from "crypto";
import jwt from "jsonwebtoken";
import { getRedis, isRedisReady } from "../config/redis.js";

const PREFIX = "denylist:jwt:";

function tokenKey(token: string): string {
  // Don't store the raw token — hash it so anyone with read access to Redis
  // can't replay a live session out of the keyspace.
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return PREFIX + hash;
}

interface JwtExpPayload {
  exp?: number;
}

function remainingLifetimeSeconds(token: string): number {
  try {
    const decoded = jwt.decode(token) as JwtExpPayload | null;
    if (!decoded?.exp) return 0;
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, decoded.exp - now);
  } catch {
    return 0;
  }
}

/**
 * Add a token to the denylist. TTL = remaining lifetime of the token so
 * entries auto-expire when the token would have anyway — keyspace stays bounded.
 * Best-effort: no-op when Redis is unavailable (logged).
 */
export async function revokeToken(token: string): Promise<void> {
  const client = getRedis();
  if (!client || !isRedisReady()) {
    console.warn("[denylist] Redis not ready, skipping revoke.");
    return;
  }
  const ttl = remainingLifetimeSeconds(token);
  if (ttl <= 0) return; // already expired
  try {
    await client.set(tokenKey(token), "1", "EX", ttl);
  } catch (err) {
    console.warn("[denylist] revokeToken error:", (err as Error).message);
  }
}

/**
 * Check whether a token has been revoked.
 *
 * Failure mode: when Redis is unavailable, returns `false` (fail-open).
 * The token already passed JWT signature + expiry verification, so allowing
 * it through degrades security only to the pre-denylist baseline rather than
 * locking out every user when Redis blips.
 */
export async function isTokenRevoked(token: string): Promise<boolean> {
  const client = getRedis();
  if (!client || !isRedisReady()) return false;
  try {
    const hit = await client.get(tokenKey(token));
    return hit !== null;
  } catch (err) {
    console.warn("[denylist] isTokenRevoked error:", (err as Error).message);
    return false;
  }
}
