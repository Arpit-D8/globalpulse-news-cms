import { NextRequest } from "next/server";
import { listAuthors, createAuthor } from "@/lib/services/author.service";
import { successResponse, handleService } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { validate } from "@/lib/validation/shared";
import { authorCreateSchema } from "@/lib/validation/author";

// ---------------------------------------------------------------------------
// GET /api/admin/authors
// ---------------------------------------------------------------------------

/**
 * List authors with search, filter, and pagination.
 *
 * Query params:
 *   - page    : page number (default 1)
 *   - limit   : items per page (default 10)
 *   - search  : substring match on name, email, bio, or twitterHandle
 *   - isActive: boolean filter (omit for all)
 */
export async function GET(request: NextRequest) {
  return handleService(async () => {
    await requireAdmin();
    const { searchParams } = request.nextUrl;

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.max(1, Number(searchParams.get("limit")) || 10);
    const search = searchParams.get("search") || "";

    const isActiveParam = searchParams.get("isActive");
    const isActive = isActiveParam === "true" ? true : isActiveParam === "false" ? false : undefined;

    const { authors, pagination } = await listAuthors({ page, limit, search, isActive });
    return successResponse({ authors, pagination });
  });
}

// ---------------------------------------------------------------------------
// POST /api/admin/authors
// ---------------------------------------------------------------------------

/**
 * Create a new author.
 */
export async function POST(request: NextRequest) {
  // Rate limit: 30 requests/minute/IP
  const rateLimitResult = await checkRateLimit(request, "admin:write");
  if (rateLimitResult) {
    return rateLimitResult;
  }

  return handleService(async () => {
    await requireAdmin();
    const body = await request.json();
    const data = validate(authorCreateSchema, body);
    const author = await createAuthor(data);
    return successResponse(author, 201);
  });
}
