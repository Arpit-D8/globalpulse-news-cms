import { getArticleById, updateArticle, deleteArticle } from "@/lib/services/article.service";
import { handleService, successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { validate } from "@/lib/validation/shared";
import { articleUpdateSchema } from "@/lib/validation/article";
import { ValidationError } from "@/lib/errors";

// ---------------------------------------------------------------------------
// GET /api/admin/articles/[id]
// ---------------------------------------------------------------------------

/**
 * Fetch a single article by ID.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleService(async () => {
    await requireAdmin();
    const { id } = await params;
    const article = await getArticleById(id);
    return successResponse(article);
  });
}

// ---------------------------------------------------------------------------
// PUT /api/admin/articles/[id]
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

  return handleService(async () => {
    await requireAdmin();
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

    const article = await updateArticle(id, transformed);
    return successResponse(article);
  });
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/articles/[id]
// ---------------------------------------------------------------------------

/**
 * Partial update — currently used for status transitions (draft → published,
 * published → archived, archived → draft).
 *
 * Validates required fields before allowing "published" status.
 * Auto-sets publishedAt when transitioning to published.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit: 60 requests/minute/IP
  const rateLimitResult = await checkRateLimit(request, "admin:write");
  if (rateLimitResult) {
    return rateLimitResult;
  }

  return handleService(async () => {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { status, publishedAt, ...rest } = body;

    const update: Record<string, unknown> = { ...rest };

    // Apply status change.
    if (status) {
      const validStatuses = ["draft", "published", "archived"];
      if (!validStatuses.includes(status)) {
        throw new ValidationError(`Invalid status: ${status}`);
      }
      update.status = status;

      // Validate required fields before allowing "published" status.
      if (status === "published") {
        const current = await getArticleById(id);

        const missingFields: string[] = [];
        if (!current.title?.trim()) missingFields.push("title");
        if (!current.content?.trim() || current.content.trim().length < 10) missingFields.push("content");
        if (!current.category?.trim()) missingFields.push("category");
        if (!current.author?.trim()) missingFields.push("author");

        if (missingFields.length > 0) {
          throw new ValidationError(`Cannot publish: missing required fields — ${missingFields.join(", ")}`);
        }
      }

      // Auto-set publishedAt when transitioning to published.
      if (status === "published" && !publishedAt) {
        update.publishedAt = new Date();
      } else if (publishedAt) {
        update.publishedAt = new Date(publishedAt);
      }
    } else if (publishedAt !== undefined) {
      // Standalone publishedAt update.
      update.publishedAt = new Date(publishedAt);
    }

    if (Object.keys(update).length === 0) {
      throw new ValidationError("No fields to update");
    }

    const article = await updateArticle(id, update);
    return successResponse(article);
  });
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/articles/[id]
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

  return handleService(async () => {
    await requireAdmin();
    const { id } = await params;
    await deleteArticle(id);
    return successResponse({});
  });
}
