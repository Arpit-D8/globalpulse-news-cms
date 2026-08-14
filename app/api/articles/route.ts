import { NextRequest, NextResponse } from "next/server";
import { listArticles, createArticle } from "@/lib/services/article.service";
import { successResponse, handleService } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { validate } from "@/lib/validation/shared";
import { articleCreateSchema } from "@/lib/validation/article";

// ---------------------------------------------------------------------------
// GET /api/articles
// ---------------------------------------------------------------------------

/**
 * List articles with search, filter, sort, and pagination.
 *
 * Query params:
 *   - search   : substring match on headline (case-insensitive)
 *   - category : exact category match
 *   - status   : "published" | "draft"
 *   - sort     : "newest" | "oldest"
 *   - page     : page number (default 1)
 *   - limit    : items per page (default 10)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const query = {
      search: searchParams.get("search") || "",
      category: searchParams.get("category") || "",
      status: searchParams.get("status") || "",
      sort: (searchParams.get("sort") || "newest") as "newest" | "oldest",
      page: Math.max(1, Number(searchParams.get("page")) || 1),
      limit: Math.max(1, Number(searchParams.get("limit")) || 10),
    };

    const { articles, pagination } = await listArticles(query);
    return successResponse({ articles, pagination });
  } catch (error: unknown) {
    console.error("[API Error]", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal Server Error" } },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/articles
// ---------------------------------------------------------------------------

/**
 * Create a new article.
 *
 * Validates input, transforms ArticleForm field names to Mongoose names,
 * generates a unique slug, and persists the document.
 * Returns the created article with all fields populated.
 */
export async function POST(request: NextRequest) {
  // Rate limit: 30 requests/minute/IP
  const rateLimitResult = await checkRateLimit(request, "admin:write");
  if (rateLimitResult) {
    return rateLimitResult;
  }

  await requireAdmin();
  return handleService(async () => {
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