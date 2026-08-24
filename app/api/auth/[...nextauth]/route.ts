import { handlers } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Rate-limited wrapper around NextAuth handlers
// ---------------------------------------------------------------------------
//
// Login attempts are rate-limited to prevent brute-force attacks.
// Only POST (signin) is rate-limited; GET (session/CSRF) is public.
// ---------------------------------------------------------------------------

/**
 * POST wrapper with rate limiting for login attempts.
 *
 * Rate limit: 5 requests/minute/IP
 */
export const POST = async (request: NextRequest) => {
  const rateLimitResult = await checkRateLimit(request, "auth:signin");
  if (rateLimitResult) {
    return rateLimitResult;
  }

  return handlers.POST(request);
};

// GET handlers remain unchanged (session fetch, CSRF token)
export const { GET } = handlers;