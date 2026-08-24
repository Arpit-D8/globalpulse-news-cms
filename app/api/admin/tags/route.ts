import { NextRequest } from "next/server";
import { listTags, createTag } from "@/lib/services/tag.service";
import { successResponse, handleService } from "@/lib/api/response";
import type { TagFilter } from "@/lib/types/tag";
import { requireAdmin } from "@/lib/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { validate } from "@/lib/validation/shared";
import { tagCreateSchema } from "@/lib/validation/tag";

// ---------------------------------------------------------------------------
// GET /api/admin/tags
// ---------------------------------------------------------------------------
// Query params:
//   page?     — page number (default 1)
//   limit?    — items per page (default 10)
//   search?   — substring match on name, slug, description
//   isActive? — boolean filter (omit for all)
// ---------------------------------------------------------------------------

/**
 * List tags with pagination, search, and optional isActive filter.
 */
export async function GET(request: NextRequest) {
  return handleService(async () => {
    await requireAdmin();
    const { searchParams } = request.nextUrl;
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
    const search = searchParams.get("search") ?? "";
    const isActiveParam = searchParams.get("isActive");

    const filter: TagFilter = {};
    switch (isActiveParam) {
      case "true":
        filter.isActive = true;
        break;

      case "false":
        filter.isActive = false;
        break;
    }
    const result = await listTags({ page, limit, search, isActive: filter.isActive });
    return successResponse(result);
  });
}

// ---------------------------------------------------------------------------
// POST /api/admin/tags
// ---------------------------------------------------------------------------

/**
 * Create a new tag.
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
    const data = validate(tagCreateSchema, body);
    const tag = await createTag(data);
    return successResponse(tag, 201);
  });
}
