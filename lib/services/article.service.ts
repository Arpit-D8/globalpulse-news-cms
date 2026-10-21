import Article from "@/models/Article";
import type { ArticleDocument } from "@/models/Article";
import CategoryModel from "@/models/Category";
import { connectDB } from "@/lib/mongodb";
import { ValidationError, NotFoundError } from "@/lib/errors";
import type { Article as ArticleType, ArticleUpdateServiceInput } from "@/lib/types/article";
import type { ArticleTag } from "@/lib/types";
import type { ObjectId } from "mongoose";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Minimal author shape extracted from populated Author document.
 */
type PublicAuthor = {
  _id: string;
  name: string;
  photoUrl?: string;
};

/**
 * Shape of a populated Category Mongoose document.
 */
type PopulatedCategory = {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
};

/**
 * Shape of a populated Media Mongoose document.
 */
type PopulatedMedia = {
  _id: string;
  url: string;
  title?: string;
  alt?: string;
};

/**
 * Public-facing article shape used by frontend routes (admin dashboard table,
 * public category pages).  Category is the NAME string and image is the
 * Cloudinary URL string.  Author is a populated object when available.
 */
type PublicArticle = {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  image: string;
  author: PublicAuthor | string;
  isBreaking: boolean;
  isFeatured: boolean;
  status: ArticleType["status"];
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Convert an ObjectId-like value to a plain string.
 */
function toStr(val: unknown) {
  return val != null && typeof (val as ObjectId).toString === "function"
    ? (val as ObjectId).toString()
    : "";
}

/**
 * Convert a Mongoose document to the plain Article type.
 *
 * Mongoose uses ObjectId for featuredImage, author, and category (when not
 * populated), but the Article DTO expects plain strings. This helper performs
 * the conversion explicitly without using `any`.
 *
 * Tags are serialized as ArticleTag[] — extracting { _id, name, slug } when
 * populated, falling back to empty name/slug for unpopulated ObjectId refs.
 */
function toArticle(doc: ArticleDocument): ArticleType {
  // Extract tag DTOs from potentially populated ObjectId references.
  const rawTags = doc.tags ?? [];
  const tags: ArticleTag[] = rawTags.map((tag) => {
    // Populated Tag document: has name and slug properties.
    if (typeof (tag as unknown as Record<string, unknown>).name === "string") {
      const tagDoc = tag as unknown as { _id: unknown; name: string; slug: string };
      return {
        _id: toStr(tagDoc._id),
        name: tagDoc.name,
        slug: tagDoc.slug,
      };
    }
    // Unpopulated: ObjectId or string.
    return {
      _id: toStr(tag),
      name: "",
      slug: "",
    };
  });

  return {
    _id: doc._id.toString(),
    title: doc.title,
    slug: doc.slug,
    summary: doc.summary,
    content: doc.content,
    category: toStr(doc.category),
    author: toStr(doc.author),
    featuredImage: toStr(doc.featuredImage),
    tags,
    status: (doc.status ?? "draft") as ArticleType["status"],
  
    isBreaking: Boolean(doc.isBreaking),
    isFeatured: Boolean(doc.isFeatured),
    seoTitle: doc.seoTitle ?? "",
    seoDescription: doc.seoDescription ?? "",
    canonicalUrl: doc.canonicalUrl ?? "",
    publishedAt: doc.publishedAt?.toISOString() ?? "",
    viewCount: doc.viewCount ?? 0,
    readingTime: doc.readingTime ?? 0,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Helper for public-facing Article serialization
// ---------------------------------------------------------------------------

/**
 * Convert a populated Mongoose document to the public Article shape.
 *
 * This is used by routes that serve the frontend (public API, admin dashboard
 * table) where category should be the category NAME string and featuredImage
 * should be the Cloudinary URL string.
 */
function toPublicArticle(doc: ArticleDocument): PublicArticle {
  // Extract category name: if populated, doc.category is a Category doc;
  // otherwise it's an ObjectId — fall back to "India".
  let categoryName = "India";
  if (doc.category != null) {
    const catDoc = doc.category as unknown as PopulatedCategory;
    if (typeof catDoc.name === "string") {
      categoryName = catDoc.name;
    } else {
      // Not populated — ObjectId string.
      categoryName = doc.category.toString();
    }
  }

  // Extract image URL: if populated, doc.featuredImage is a Media doc;
  // otherwise it's an ObjectId or null.
  let imageUrl = "";
  if (doc.featuredImage != null) {
    const imgDoc = doc.featuredImage as unknown as PopulatedMedia;
    if (typeof imgDoc.url === "string") {
      imageUrl = imgDoc.url;
    } else {
      // Not populated — store ObjectId string (will show fallback on frontend).
      imageUrl = doc.featuredImage.toString();
    }
  }

  // Extract author info: if populated, doc.author is an Author doc;
  // otherwise it's an ObjectId or null.
  let authorInfo: PublicAuthor | string = "";
  if (doc.author != null) {
    const authorDoc = doc.author as unknown as PublicAuthor;
    if (typeof authorDoc.name === "string") {
      // Populated — extract name and photoUrl.
      authorInfo = {
        _id: toStr(doc.author._id),
        name: authorDoc.name,
        photoUrl: authorDoc.photoUrl || undefined,
      };
    } else {
      // Not populated — ObjectId string.
      authorInfo = doc.author.toString();
    }
  }

  return {
    _id: doc._id.toString(),
    title: doc.title,
    slug: doc.slug,
    summary: doc.summary,
    content: doc.content,
    category: categoryName,
    image: imageUrl,
    author: authorInfo,
    isBreaking: Boolean(doc.isBreaking),
    isFeatured: Boolean(doc.isFeatured),
    status: (doc.status ?? "draft") as ArticleType["status"],
    publishedAt: doc.publishedAt?.toISOString() ?? "",
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString() ?? new Date().toISOString(),
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

  const doc = await Article.findById(id).populate("tags");

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
 * Category and featuredImage are populated so the frontend receives
 * human-readable category names and Cloudinary image URLs.
 */
export async function listArticles(
  query: ArticleListQuery = {}
): Promise<{
  articles: PublicArticle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> {
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
    // Resolve category name to ObjectId (Article schema stores ObjectId ref).
    const catDoc = await CategoryModel.findOne({ name: category });
    if (catDoc) {
      filter.category = catDoc._id;
    } else {
      // Category not found — return empty result.
      return {
        articles: [],
        pagination: { page, limit, total: 0, pages: 0 },
      };
    }
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
      .populate("category")
      .populate("featuredImage")
      .populate("author"),
    Article.countDocuments(filter),
  ]);

  return {
    articles: articles.map(toPublicArticle),
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
  );

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
 * Atomically reserve a slug using findOneAndUpdate with upsert.
 *
 * This prevents the race condition where two concurrent requests both pass
 * the `exists()` check before either inserts, causing a duplicate key error.
 *
 * The upsert document uses a dummy slug value (`__reserved__`) so that when
 * the document is created, the slug is already set. The actual article
 * document will overwrite this with the real slug later.
 *
 * Returns the reserved slug string, or null if the base slug is unavailable
 * and all suffix attempts also fail.
 */
/**
 * Find an available slug without inserting placeholder articles.
 */
async function findAvailableSlug(
  baseSlug: string
): Promise<string | null> {
  if (!(await Article.exists({ slug: baseSlug }))) {
    return baseSlug;
  }

  for (let suffix = 1; suffix <= 100; suffix++) {
    const candidate = `${baseSlug}-${suffix}`;

    if (!(await Article.exists({ slug: candidate }))) {
      return candidate;
    }
  }

  return null;
}

/**
 * Generate a unique slug by appending a numeric suffix if necessary.
 *
 * Checks existing article slugs without creating placeholder documents.
 * The MongoDB unique index remains the final safeguard against collisions.
 */
export async function generateUniqueSlug(baseSlug: string): Promise<string> {
  if (!baseSlug) {
    throw new ValidationError("Slug cannot be empty");
  }

  await connectDB();

  const availableSlug = await findAvailableSlug(baseSlug);
if (availableSlug) {
  return availableSlug;
}

  // Fallback: should rarely happen, but use the old non-atomic approach
  // as a last resort (with a very high suffix to minimize collision risk).
  let suffix = 101;
  while (suffix <= 10000) {
    const candidate = `${baseSlug}-${suffix}`;
    if (!(await Article.exists({ slug: candidate }))) {
      return candidate;
    }
    suffix++;
  }

  throw new ValidationError("Unable to generate a unique slug");
}
