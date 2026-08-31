import { NextResponse } from "next/server";

/**
 * GET /api/health
 *
 * Minimal production health check.
 * - Returns 200 with structured JSON when the application is running.
 * - Does NOT expose secrets, credentials, or implementation details.
 * - Does NOT perform expensive database operations.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "news-website",
  });
}
