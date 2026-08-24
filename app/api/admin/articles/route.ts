import { listArticles, createArticle } from "@/lib/services/article.service";
import { successResponse, handleService } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { validate } from "@/lib/validation/shared";
import { articleCreateSchema } from "@/lib/validation/article";

// ---------------------------------------------------------------------------
// GET /api/admin/articles
// ---------------------------------------------------------------------------

/**
 * List articles with search, filter, sort, and pagination.
 *
 * Query params:
 *   - page   : page number (default 1)
 *   - limit  : items per page (default 10)
 *   - search : substring match on title (case-insensitive)
 *
 * Returns { articles, pagination }.
 */
export async function GET(request: Request) {
  return handleService(async () => {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    const query = {
      search: searchParams.get("search") || "",
      status: searchParams.get("status") || "",
      page: Math.max(1, Number(searchParams.get("page")) || 1),
      limit: Math.max(1, Number(searchParams.get("limit")) || 10),
    };

    const { articles, pagination } = await listArticles(query);
    return successResponse({ articles, pagination });
  });
}

// ---------------------------------------------------------------------------
// POST /api/admin/articles
// ---------------------------------------------------------------------------

/**
 * Create a new article from the admin panel.
 *
 * Accepts JSON body matching ArticleFormValues and persists the document
 * via the article service layer (which handles validation and slug
 * uniqueness). Returns the created article with status 201.
 *
 * Field transformation: ArticleForm sends authorId / categoryId /
 * featuredImageId / tags / seoTitle / seoDescription / canonicalUrl.  These
 * are mapped to Mongoose field names (author / category / featuredImage)
 * after Zod validation so the service layer receives the correct shape.
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
    const data = validate(articleCreateSchema, body);

    // Transform ArticleForm field names → Mongoose field names.
    const transformed = {
      title: data.title,
      slug: data.slug ?? "",
      summary: data.summary,
      content: data.content,
      author: data.authorId,
      category: data.categoryId,
      featuredImage: data.featuredImageId || undefined,
      tags: data.tags,
      status: data.status,
      isBreaking: data.isBreaking,
      isFeatured: data.isFeatured,
      seoTitle: data.seoTitle || undefined,
      seoDescription: data.seoDescription || undefined,
      canonicalUrl: data.canonicalUrl || undefined,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
    };

    const article = await createArticle(transformed);
    return successResponse(article, 201);
  });
}
