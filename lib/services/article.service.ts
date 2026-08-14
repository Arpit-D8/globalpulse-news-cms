import Article from "@/models/Article";
import type { ArticleDocument } from "@/models/Article";
import { connectDB } from "@/lib/mongodb";
import { ValidationError, NotFoundError } from "@/lib/errors";
import type { Article as ArticleType, ArticleCreateInput, ArticleUpdateServiceInput } from "@/lib/types/article";
import type { ObjectId } from "mongoose";

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Convert a Mongoose document to the plain Article type.
 *
 * Mongoose uses ObjectId for featuredImage, author, and category (when not
 * populated), but the Article DTO expects plain strings. This helper performs
 * the conversion explicitly without using `any`.
 */
function toArticle(doc: ArticleDocument): ArticleType {
  const toStr = (val: unknown) =>
    val != null && typeof (val as ObjectId).toString === "function"
      ? (val as ObjectId).toString()
      : "";

  return {
    _id: doc._id.toString(),
    title: doc.title,
    slug: doc.slug,
    summary: doc.summary,
    content: doc.content,
    category: toStr(doc.category),
    author: toStr(doc.author),
    featuredImage: toStr(doc.featuredImage),
    tags: doc.tags ?? [],
    status: (doc.status ?? "draft") as ArticleType["status"],
    isBreaking: Boolean(doc.isBreaking),
    isFeatured: Boolean(doc.isFeatured),
    seoTitle: doc.seoTitle ?? "",
    seoDescription: doc.seoDescription ?? "",
    canonicalUrl: doc.canonicalUrl ?? "",
    publishedAt: doc.publishedAt?.toISOString() ?? new Date().toISOString(),
    viewCount: doc.viewCount ?? 0,
    readingTime: doc.readingTime ?? 0,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Create a new article.
 *
 * Expects input with Mongoose-compatible field names (author, category,
 * featuredImage, tags, seoTitle, etc.).  The admin API routes transform
 * ArticleForm names (authorId → author) before calling this function.
 * Slug uniqueness is enforced; a ValidationError is thrown when the slug
 * is empty.
 */
export async function createArticle(
  input: Record<string, unknown>
): Promise<ArticleType> {
  await connectDB();

  const { slug = "", ...rest } = input;
  const uniqueSlug = await generateUniqueSlug(String(slug));

  const doc = await Article.create({
    ...rest,
    slug: uniqueSlug,
  });

  return toArticle(doc);
}

// ---------------------------------------------------------------------------
// Retrieve
// ---------------------------------------------------------------------------

/**
 * Retrieve a single article by its _id.
 *
 * Throws NotFoundError when the article does not exist.
 * Uses lean for improved performance.
 */
export async function getArticleById(id: string): Promise<ArticleType> {
  await connectDB();

  const doc = await Article.findById(id);

  if (!doc) {
    throw new NotFoundError(`Article with id ${id} not found`);
  }

  return toArticle(doc);
}

// ---------------------------------------------------------------------------
// List (search, filter, sort, paginate)
// ---------------------------------------------------------------------------

export type ArticleListQuery = {
  search?: string;
  category?: string;
  status?: string;
  sort?: "newest" | "oldest";
  page?: number;
  limit?: number;
};

export type ArticleListResult = {
  articles: ArticleType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

/**
 * List articles with search, filter, sort, and pagination.
 *
 * Returns a paginated slice of articles matching the given criteria.
 */
export async function listArticles(
  query: ArticleListQuery = {}
): Promise<ArticleListResult> {
  const {
    search = "",
    category = "",
    status = "",
    sort = "newest",
    page = 1,
    limit = 10,
  } = query;

  await connectDB();

  // Build query filter.
  const filter: Record<string, unknown> = {};

  if (search) {
    filter.title = { $regex: search, $options: "i" };
  }

  if (category) {
    filter.category = category;
  }

  if (status) {
    filter.status = status;
  }

  // Build sort order.
  const sortOrder = sort === "oldest" ? 1 : -1;

  // Fetch paginated articles.
  const [articles, total] = await Promise.all([
    Article.find(filter)
      .sort({ publishedAt: sortOrder, createdAt: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-content") // Exclude full content for list display
      .lean(),
    Article.countDocuments(filter),
  ]);

  return {
    articles: articles.map(toArticle),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

/**
 * Update an existing article by its _id.
 *
 * Partial update — only provided fields are modified. Throws NotFoundError
 * when the article does not exist. Returns the updated Article DTO.
 *
 * Expects input with Mongoose-compatible field names.  Slug uniqueness is
 * enforced when a new slug is provided.
 */
export async function updateArticle(
  id: string,
  input: ArticleUpdateServiceInput
): Promise<ArticleType> {
  await connectDB();

  // Extract slug if present; generate unique variant.
  const { slug, ...rest } = input;
  if (slug !== undefined) {
    const uniqueSlug = await generateUniqueSlug(String(slug));
    (rest as Record<string, unknown>).slug = uniqueSlug;
  }

  const updated = await Article.findByIdAndUpdate(
    id,
    rest,
    { new: true }
  ).select("-content"); // Exclude full content for update response

  if (!updated) {
    throw new NotFoundError(`Article with id ${id} not found`);
  }

  return toArticle(updated);
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/**
 * Delete an article by its _id.
 *
 * Throws NotFoundError when the article does not exist.
 */
export async function deleteArticle(id: string): Promise<void> {
  await connectDB();

  const deleted = await Article.findByIdAndDelete(id);

  if (!deleted) {
    throw new NotFoundError(`Article with id ${id} not found`);
  }
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Generate a unique slug by appending a numeric suffix if necessary.
 *
 * e.g. "my-headline" → "my-headline" → "my-headline-1" → "my-headline-2" …
 */
async function generateUniqueSlug(baseSlug: string): Promise<string> {
  if (!baseSlug) {
    throw new ValidationError("Slug cannot be empty");
  }

  await connectDB();

  let candidate = baseSlug;
  let suffix = 1;

  // Check for existing article with the same slug (any status).
  while (await Article.exists({ slug: candidate })) {
    candidate = `${baseSlug}-${suffix}`;
    suffix++;
  }

  return candidate;
}
