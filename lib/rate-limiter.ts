// ---------------------------------------------------------------------------
// Rate Limiter Interface
// ---------------------------------------------------------------------------
//
// This module provides an in-memory sliding-window rate limiter for
// development and single-instance deployments.
//
// PRODUCTION MIGRATION:
// Replace the in-memory implementation with a Redis-backed one (e.g.
// Upstash Rate Limit) by:
//   1. Installing a Redis client (`@upstash/ratelimit` or `redis`)
//   2. Implementing the `RateLimiter` interface in `lib/rate-limiter/redis.ts`
//   3. Updating this file's `createRateLimiter()` to return the Redis variant
//
// The interface guarantees:
//   - `allow(key): { allowed: true }` or `{ allowed: false, retryAfter: number }`
//   - Thread-safe (single-threaded Node.js is inherently safe for the in-memory version)
//   - Automatic cleanup of expired entries
// ---------------------------------------------------------------------------

/**
 * Result of a rate limit check.
 */
export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfter: number }; // seconds until next request allowed

/**
 * Configuration for a rate limit bucket.
 */
export type RateLimitConfig = {
  /** Maximum number of requests allowed within the window */
  max: number;
  /** Window size in seconds */
  window: number;
};

/**
 * Rate limiter interface.
 *
 * Implementations can be in-memory (development) or Redis-backed (production).
 */
export interface RateLimiter {
  /**
   * Check if a request is allowed.
   * @param key - Unique identifier (e.g. IP address)
   * @param config - Rate limit configuration (max requests and window size)
   * @returns Result indicating if the request is allowed
   */
  allow(key: string, config: RateLimitConfig): Promise<RateLimitResult>;

  /**
   * Reset the rate limit for a specific key.
   * @param key - Unique identifier to reset
   */
  reset(key: string): Promise<void>;
}

/**
 * In-memory sliding window rate limiter.
 *
 * Uses a Map to store request timestamps per key.
 * Suitable for development and single-instance deployments.
 *
 * NOT suitable for production with multiple Next.js instances
 * (each instance would have its own memory space).
 */
export class InMemoryRateLimiter implements RateLimiter {
  private stores: Map<string, number[]>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.stores = new Map();
    this.cleanupInterval = null;
    this.startCleanup();
  }

  async allow(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    const entries = this.stores.get(key) || [];

    // Calculate window start in milliseconds
    const windowStart = now - config.window * 1000;

    // Filter to only entries within the current window
    const recentEntries = entries.filter((timestamp) => timestamp > windowStart);

    if (recentEntries.length >= config.max) {
      // Calculate retry after (seconds until the oldest entry in window expires)
      const retryAfter = config.window - Math.floor((now - recentEntries[0]) / 1000);
      this.stores.set(key, recentEntries);
      return { allowed: false, retryAfter: Math.max(1, retryAfter) };
    }

    recentEntries.push(now);
    this.stores.set(key, recentEntries);
    return { allowed: true };
  }

  async reset(key: string): Promise<void> {
    this.stores.delete(key);
  }

  private startCleanup(): void {
    // Clean up entries older than 10 minutes every minute
    this.cleanupInterval = setInterval(() => {
      const cutoff = Date.now() - 10 * 60 * 1000;
      for (const [key, entries] of this.stores.entries()) {
        const filtered = entries.filter((ts) => ts > cutoff);
        if (filtered.length === 0) {
          this.stores.delete(key);
        } else {
          this.stores.set(key, filtered);
        }
      }
    }, 60 * 1000);
  }
}

/**
 * Create a rate limiter instance.
 *
 * Returns an in-memory rate limiter by default.
 * To use Redis in production, change this to return a RedisRateLimiter.
 *
 * @example
 * // Production (with Upstash):
 * import { RedisRateLimiter } from "@/lib/rate-limiter/redis";
 * const redis = new RedisRateLimiter({ ... });
 * export function createRateLimiter() {
 *   return redis;
 * }
 */
export function createRateLimiter(): RateLimiter {
  return new InMemoryRateLimiter();
}

// ---------------------------------------------------------------------------
// Singleton instance
// ---------------------------------------------------------------------------

let rateLimiter: RateLimiter | null = null;

/**
 * Get or create the singleton rate limiter instance.
 *
 * Uses a module-level singleton to avoid creating multiple instances
 * across hot-reloads in development.
 */
export function getRateLimiter(): RateLimiter {
  if (!rateLimiter) {
    rateLimiter = createRateLimiter();
  }
  return rateLimiter;
}
