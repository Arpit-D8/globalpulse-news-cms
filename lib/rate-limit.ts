// ---------------------------------------------------------------------------
// Rate Limit Helper
// ---------------------------------------------------------------------------
//
// Provides a reusable function to check rate limits and return appropriate
// responses. Each endpoint can configure its own limits.
//
// Usage:
//   const result = await checkRateLimit(request, "endpoint-key", { max: 5, window: 60 });
//   if (result) return result; // Returns NextResponse when rate limited
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { getRateLimiter, type RateLimitConfig } from "@/lib/rate-limiter";

/**
 * Configuration for an endpoint's rate limit.
 */
export type EndpointRateLimitConfig = {
  /** Maximum requests per window */
  max: number;
  /** Window size in seconds (default: 60) */
  window?: number;
};

/**
 * Default rate limit configuration for endpoints that don't specify one.
 */
const DEFAULT_CONFIG: EndpointRateLimitConfig = {
  max: 30,
  window: 60,
};

/**
 * Rate limit configurations for each endpoint.
 *
 * Modify these values to adjust rate limits.
 * All windows are in seconds.
 */
const ENDPOINT_CONFIGS: Record<string, EndpointRateLimitConfig> = {
  // Login endpoint
  "auth:signin": { max: 5, window: 60 },

  // Article generation (AI)
  "generate-article": { max: 5, window: 60 },

  // News import
  "news:import": { max: 2, window: 60 },

  // Admin write endpoints (POST, PUT, DELETE)
  "admin:write": { max: 30, window: 60 },
};

/**
 * Extract client IP address from the request.
 *
 * Checks X-Forwarded-For, X-Real-IP, and falls back to remoteAddress.
 * Handles proxy headers from Vercel/Cloudflare.
 *
 * Accepts either a NextRequest or a standard Web Request — both expose
 * the `headers` interface needed for IP extraction.
 */
export function getClientIp(request: NextRequest | Request): string {
  // Check for Vercel's IP header first
  const vercelIp = request.headers.get("x-vercel-ip");
  if (vercelIp) {
    return vercelIp;
  }

  // Check for Cloudflare's IP header
  const cloudflareIp = request.headers.get("cf-connecting-ip");
  if (cloudflareIp) {
    return cloudflareIp;
  }

  // Check for X-Forwarded-For (proxy)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // The client IP is the first IP in the chain
    return forwardedFor.split(",")[0].trim();
  }

  // Check for X-Real-IP (nginx)
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fall back to X-Forwarded-For (may be undefined in some environments)
  return request.headers.get("x-forwarded-for") || "unknown";
}

/**
 * Get the rate limit key for an endpoint and client IP.
 */
function getRateLimitKey(endpoint: string, clientIp: string): string {
  return `${endpoint}:${clientIp}`;
}

/**
 * Get the rate limit configuration for an endpoint.
 */
function getConfig(endpoint: string): EndpointRateLimitConfig {
  return ENDPOINT_CONFIGS[endpoint] || DEFAULT_CONFIG;
}

/**
 * Check rate limit for an endpoint.
 *
 * Accepts either a NextRequest or a standard Web Request — both expose
 * the `headers` interface needed for IP extraction.
 *
 * @param request - The request object (NextRequest or standard Request)
 * @param endpoint - Endpoint identifier (must be in ENDPOINT_CONFIGS)
 * @returns NextResponse if rate limited, null if allowed
 */
export async function checkRateLimit(
  request: Request,
  endpoint: string
): Promise<NextResponse | null> {
  const config = getConfig(endpoint);
  if (!config) {
    return null; // No rate limit configured for this endpoint
  }

  // Normalize: ensure window is always defined (fallback to DEFAULT_CONFIG.window)
  const normalizedConfig: RateLimitConfig = {
    max: config.max,
    window: config.window ?? 60,
  };

  const clientIp = getClientIp(request as NextRequest | Request);
  const key = getRateLimitKey(endpoint, clientIp);
  const limiter = getRateLimiter();

  const result = await limiter.allow(key, normalizedConfig);

  if (!result.allowed) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: {
          message: "Too many requests. Please try again later.",
          retryAfter: result.retryAfter,
        },
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(result.retryAfter),
        },
      }
    );
  }

  return null;
}
