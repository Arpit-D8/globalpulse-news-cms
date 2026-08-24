import { listCategories, createCategory } from "@/lib/services/category.service";
import { successResponse, handleService } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { validate } from "@/lib/validation/shared";
import { categoryCreateSchema } from "@/lib/validation/category";

// ---------------------------------------------------------------------------
// GET /api/admin/categories
// ---------------------------------------------------------------------------

/**
 * List categories with search, filter, and pagination.
 *
 * Query params:
 *   - page   : page number (default 1)
 *   - limit  : items per page (default 10)
 *   - search : substring match on name or slug (case-insensitive)
 *   - isActive: boolean filter (omit for all)
 *
 * Returns { categories, pagination }.
 */
export async function GET(request: Request) {
  return handleService(async () => {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    const query = {
      search: searchParams.get("search") || "",
      page: Math.max(1, Number(searchParams.get("page")) || 1),
      limit: Math.max(1, Number(searchParams.get("limit")) || 10),
      isActive: searchParams.get("isActive") === "true"
        ? true
        : searchParams.get("isActive") === "false"
          ? false
          : undefined,
    };

    const { categories, pagination } = await listCategories(query);
    return successResponse({ categories, pagination });
  });
}

// ---------------------------------------------------------------------------
// POST /api/admin/categories
// ---------------------------------------------------------------------------

/**
 * Create a new category.
 */
export async function POST(request: Request) {
  // Rate limit: 30 requests/minute/IP
  const rateLimitResult = await checkRateLimit(request, "admin:write");
  if (rateLimitResult) {
    return rateLimitResult;
  }

  return handleService(async () => {
    await requireAdmin();
    const body = await request.json();
    const data = validate(categoryCreateSchema, body);
    const category = await createCategory(data);
    return successResponse(category, 201);
  });
}
