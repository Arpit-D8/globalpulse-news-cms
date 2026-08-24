import {
  getCategoryByIdOrThrow,
  updateCategory,
  deleteCategory,
} from "@/lib/services/category.service";
import { handleService, successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { validate } from "@/lib/validation/shared";
import { categoryUpdateSchema } from "@/lib/validation/category";

// ---------------------------------------------------------------------------
// GET /api/admin/categories/[id]
// ---------------------------------------------------------------------------

/**
 * Get a single category by ID.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleService(async () => {
    await requireAdmin();
    const { id } = await params;
    const category = await getCategoryByIdOrThrow(id);
    return successResponse(category);
  });
}

// ---------------------------------------------------------------------------
// PUT /api/admin/categories/[id]
// ---------------------------------------------------------------------------

/**
 * Update an existing category.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit: 30 requests/minute/IP
  const rateLimitResult = await checkRateLimit(request, "admin:write");
  if (rateLimitResult) {
    return rateLimitResult;
  }

  return handleService(async () => {
    const { id } = await params;
    const body = await request.json();
    const data = validate(categoryUpdateSchema, body);
    const category = await updateCategory(id, data);
    return successResponse(category);
  });
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/categories/[id]
// ---------------------------------------------------------------------------

/**
 * Delete a category by ID.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit: 30 requests/minute/IP
  const rateLimitResult = await checkRateLimit(request, "admin:write");
  if (rateLimitResult) {
    return rateLimitResult;
  }

  return handleService(async () => {
    await requireAdmin();
    const { id } = await params;
    const category = await deleteCategory(id);
    return successResponse(category);
  });
}
