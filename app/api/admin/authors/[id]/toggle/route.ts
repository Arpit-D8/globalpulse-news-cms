import { toggleAuthorStatus } from "@/lib/services/author.service";
import { successResponse, handleService } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";

// ---------------------------------------------------------------------------
// PATCH /api/admin/authors/[id]/toggle
// ---------------------------------------------------------------------------

/**
 * Toggle author active/inactive status.
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
    const author = await toggleAuthorStatus(id);
    return successResponse(author);
  });
}
