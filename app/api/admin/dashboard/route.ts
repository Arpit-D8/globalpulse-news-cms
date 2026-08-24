import { NextResponse } from "next/server";
import { getDashboardAnalytics } from "@/lib/services/dashboard.service";
import { handleService, successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth-guard";

// ---------------------------------------------------------------------------
// GET /api/admin/dashboard
// ---------------------------------------------------------------------------

/**
 * Return dashboard statistics and analytics for the admin panel.
 *
 * Response shape:
 * {
 *   success: true,
 *   data: {
 *     stats: { totalArticles, publishedArticles, ... },
 *     dailyPublishCount: [{ date, count }, ...],
 *     categoryCount: [{ category, count }, ...],
 *     statusCount: [{ status, count }, ...],
 *     topAuthors: [{ author, count }, ...]
 *   }
 * }
 */
export async function GET() {
  return handleService(async () => {
    await requireAdmin();
    const analytics = await getDashboardAnalytics();
    return successResponse(analytics);
  });
}
