import {
  getTagByIdOrThrow,
  updateTag,
  deleteTag,
} from "@/lib/services/tag.service";
import { handleService, successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { validate } from "@/lib/validation/shared";
import { tagUpdateSchema } from "@/lib/validation/tag";

// ---------------------------------------------------------------------------
// GET /api/admin/tags/[id]
// ---------------------------------------------------------------------------

/**
 * Get a single tag by ID.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleService(async () => {
    await requireAdmin();
    const { id } = await params;
    const tag = await getTagByIdOrThrow(id);
    return successResponse(tag);
  });
}

// ---------------------------------------------------------------------------
// PUT /api/admin/tags/[id]
// ---------------------------------------------------------------------------

/**
 * Update an existing tag.
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
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const data = validate(tagUpdateSchema, body);
    const tag = await updateTag(id, data);
    return successResponse(tag);
  });
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/tags/[id]
// ---------------------------------------------------------------------------

/**
 * Delete a tag by ID (soft-delete via isActive toggle).
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
    const tag = await deleteTag(id);
    return successResponse(tag);
  });
}
