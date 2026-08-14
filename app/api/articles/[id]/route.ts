import { getArticleById, updateArticle, deleteArticle } from "@/lib/services/article.service";
import { handleService, successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { validate } from "@/lib/validation/shared";
import { articleUpdateSchema } from "@/lib/validation/article";
import type { ArticleUpdateServiceInput } from "@/lib/types/article";

// ---------------------------------------------------------------------------
// GET /api/articles/[id]
// ---------------------------------------------------------------------------

/**
 * Get a single article by ID.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleService(async () => {
    const { id } = await params;
    const article = await getArticleById(id);
    return successResponse(article);
  });
}

// ---------------------------------------------------------------------------
// PUT /api/articles/[id]
// ---------------------------------------------------------------------------

/**
 * Update an existing article by ID.
 *
 * Field transformation: ArticleForm sends authorId / categoryId /
 * featuredImageId / tags / seoTitle / seoDescription / canonicalUrl.  These
 * are mapped to Mongoose field names (author / category / featuredImage)
 * after Zod validation so the service layer receives the correct shape.
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

  await requireAdmin();
  return handleService(async () => {
    const { id } = await params;
    const body = await request.json();
    const data = validate(articleUpdateSchema, body);

    // Transform ArticleForm field names → Mongoose field names.
    const transformed: Record<string, unknown> = {};
    if (data.title !== undefined) transformed.title = data.title;
    if (data.slug !== undefined) transformed.slug = data.slug;
    if (data.summary !== undefined) transformed.summary = data.summary;
    if (data.content !== undefined) transformed.content = data.content;
    if (data.authorId !== undefined) transformed.author = data.authorId;
    if (data.categoryId !== undefined) transformed.category = data.categoryId;
    if (data.featuredImageId !== undefined) transformed.featuredImage = data.featuredImageId;
    if (data.tags !== undefined) transformed.tags = data.tags;
    if (data.status !== undefined) transformed.status = data.status;
    if (data.isBreaking !== undefined) transformed.isBreaking = data.isBreaking;
    if (data.isFeatured !== undefined) transformed.isFeatured = data.isFeatured;
    if (data.seoTitle !== undefined) transformed.seoTitle = data.seoTitle;
    if (data.seoDescription !== undefined) transformed.seoDescription = data.seoDescription;
    if (data.canonicalUrl !== undefined) transformed.canonicalUrl = data.canonicalUrl;
    if (data.publishedAt !== undefined) transformed.publishedAt = new Date(data.publishedAt);

    const article = await updateArticle(id, transformed as ArticleUpdateServiceInput);
    return successResponse(article);
  });
}

// ---------------------------------------------------------------------------
// DELETE /api/articles/[id]
// ---------------------------------------------------------------------------

/**
 * Delete an article by ID.
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

  await requireAdmin();
  return handleService(async () => {
    const { id } = await params;
    await deleteArticle(id);
    return successResponse({});
  });
}
