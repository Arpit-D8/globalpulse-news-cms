import { NextRequest } from "next/server";
import { getAllTags } from "@/lib/services/tag.service";
import { successResponse, handleService } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth-guard";

/**
 * GET /api/admin/tags/all
 * Returns ALL active tags without pagination.
 */
export async function GET(request: NextRequest) {
  return handleService(async () => {
    await requireAdmin();
    const tags = await getAllTags({ isActive: true });
    return successResponse(tags);
  });
}
