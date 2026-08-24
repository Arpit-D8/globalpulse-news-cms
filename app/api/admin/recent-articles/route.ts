import { getRecentArticles } from "@/lib/services/dashboard.service";
import { successResponse, handleService } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth-guard";

// ---------------------------------------------------------------------------
// GET /api/admin/recent-articles
// ---------------------------------------------------------------------------

/**
 * Return the 5 most recently updated articles for the admin dashboard.
 */
export async function GET() {
  return handleService(async () => {
    await requireAdmin();
    const articles = await getRecentArticles(5);
    return successResponse({ articles });
  });
}
