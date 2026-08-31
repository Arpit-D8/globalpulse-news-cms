import {
  NewsAPIProvider,
  NewsManager,
} from "@/services/ai/news";
import { successResponse, handleService } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth-guard";

// ---------------------------------------------------------------------------
// GET /api/news/fetch
// ---------------------------------------------------------------------------

/**
 * Fetch the latest news articles from all configured providers.
 *
 * Returns the raw articles without importing them into the database.
 */
export async function GET() {
  return handleService(async () => {
    await requireAdmin();
    const manager = new NewsManager([new NewsAPIProvider()]);
    const articles = await manager.fetchAllNews();
    return successResponse({ total: articles.length, articles });
  });
}