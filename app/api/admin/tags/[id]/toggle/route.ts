import { toggleTagStatus } from "@/lib/services/tag.service";
import { successResponse, handleService } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";

// ---------------------------------------------------------------------------
// PATCH /api/admin/tags/[id]/toggle
// ---------------------------------------------------------------------------

/**
 * Toggle tag active/inactive status.
 */
export async function PATCH(
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
    const tag = await toggleTagStatus(id);
    return successResponse(tag);
  });
}
