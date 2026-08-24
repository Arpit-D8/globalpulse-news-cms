import { reorderCategories } from "@/lib/services/category.service";
import { successResponse, handleService } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { validate } from "@/lib/validation/shared";
import { categoryReorderSchema } from "@/lib/validation/category-reorder";

// ---------------------------------------------------------------------------
// PATCH /api/admin/categories/reorder
// ---------------------------------------------------------------------------
// Body: { reorders: Array<{ id: string; displayOrder: number }> }
// ---------------------------------------------------------------------------

/**
 * Reorder categories by updating their displayOrder values.
 */
export async function PATCH(request: Request) {
  // Rate limit: 30 requests/minute/IP
  const rateLimitResult = await checkRateLimit(request, "admin:write");
  if (rateLimitResult) {
    return rateLimitResult;
  }

  return handleService(async () => {
    await requireAdmin();
    const body = await request.json();
    const data = validate(categoryReorderSchema, body);
    const categories = await reorderCategories(data.reorders);
    return successResponse(categories);
  });
}
