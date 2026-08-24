import mongoose, { isValidObjectId } from "mongoose";
import ArticleModel from "@/models/Article";
import TagModel from "@/models/Tag";
import CategoryModel from "@/models/Category";
import { CATEGORIES } from "@/lib/constants";
import { connectDB } from "@/lib/mongodb";
import { slugify } from "@/lib/utils/slug";
import type {
  Article,
  ArticleMutationInput,
  ArticleStatus,
  ArticleTag,
  Category,
} from "@/lib/types";

export type ObjectIdLike = {
  toString(): string;
};

type ArticleRecord = {
  _id: ObjectIdLike;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: { _id: ObjectIdLike; name: Category; slug: string };
  featuredImage?: { _id: ObjectIdLike; url: string } | null;
  author?: { _id: ObjectIdLike; name: string } | null;
  tags?: (string | { _id: ObjectIdLike; name: string; slug: string })[];
  isBreaking?: boolean | null;
  isFeatured?: boolean | null;
  status?: ArticleStatus | null;
  publishedAt?: Date | string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

export type SerializedArticleSource = ArticleRecord;

type ArticlePayload = {
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: Category;
  image: string;
  author: string;
  isBreaking: boolean;
  isFeatured: boolean;
  status: ArticleStatus;
  publishedAt: Date;
};

function toIsoDate(value: Date | string | null | undefined, fallback?: string) {
  const source = value ?? fallback ?? new Date();
  const date = source instanceof Date ? source : new Date(source);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function booleanValue(value: unknown) {
  return value === true || value === "true" || value === "on";
}

function excerptFromContent(content: string) {
  return content.replace(/\s+/g, " ").trim().slice(0, 220);
}

export function serializeArticle(article: ArticleRecord): Article {
  const createdAt = toIsoDate(article.createdAt);

  // Extract tag DTOs from potentially populated ObjectId references.
  const rawTags = article.tags ?? [];
  const tags: ArticleTag[] = rawTags.map((tag) => {
    // Unpopulated: bare ObjectId string.
    if (typeof tag === "string") {
      return { _id: tag, name: "", slug: "" };
    }
    // Populated Tag document: { _id: ObjectIdLike, name: string, slug: string }
    const objTag = tag as { _id?: ObjectIdLike; name?: string; slug?: string };
    const id =
      objTag._id && typeof (objTag._id as ObjectIdLike).toString === "function"
        ? (objTag._id as ObjectIdLike).toString()
        : "";
    return {
      _id: id,
      name: objTag.name ?? "",
      slug: objTag.slug ?? "",
    };
  });

  return {
    _id: article._id.toString(),
    title: article.title,
    slug: article.slug,
    summary: article.summary,
    content: article.content,
    category: article.category?.name ?? "India",
    image: article.featuredImage?.url ?? "",
    author: article.author?.name ?? "VIDARBHA PRINT Desk",
    tags,
    isBreaking: Boolean(article.isBreaking),
    isFeatured: Boolean(article.isFeatured),
    status: article.status ?? "draft",
    publishedAt: article.publishedAt ? toIsoDate(article.publishedAt) : "",
    createdAt,
    updatedAt: toIsoDate(article.updatedAt, createdAt),
  };
}

/**
 * Atomically reserve a slug using findOneAndUpdate with upsert.
 *
 * Prevents race conditions where concurrent requests both pass the exists()
 * check before either inserts.
 */
async function reserveSlugAtomically(
  baseSlug: string,
  ignoreId?: string
): Promise<string | null> {
  const query: Record<string, unknown> = { slug: baseSlug };

  if (ignoreId && isValidObjectId(ignoreId)) {
    query._id = { $ne: new mongoose.Types.ObjectId(ignoreId) };
  }

  const result = await ArticleModel.findOneAndUpdate(
    query,
    { $setOnInsert: { slug: baseSlug } },
    { upsert: true, returnDocument: "after" }
  );

  if (result) {
    return baseSlug;
  }

  // Slug already existed — try with suffixes.
  let suffix = 1;
  while (suffix <= 100) {
    const candidate = `${baseSlug}-${suffix}`;
    const suffixQuery: Record<string, unknown> = { slug: candidate };

    if (ignoreId && isValidObjectId(ignoreId)) {
      suffixQuery._id = { $ne: new mongoose.Types.ObjectId(ignoreId) };
    }

    const reserved = await ArticleModel.findOneAndUpdate(
      suffixQuery,
      { $setOnInsert: { slug: candidate } },
      { upsert: true, returnDocument: "after" }
    );

    if (reserved) {
      return candidate;
    }

    suffix++;
  }

  return null;
}

export async function getUniqueSlug(
  title: string,
  requestedSlug?: string,
  ignoreId?: string
) {
  await connectDB();

  const baseSlug = slugify(requestedSlug || title) || `article-${Date.now()}`;

  const reserved = await reserveSlugAtomically(baseSlug, ignoreId);
  if (reserved) {
    return reserved;
  }

  // Fallback: should rarely happen.
  let suffix = 101;
  while (suffix <= 10000) {
    const candidate = `${baseSlug}-${suffix}`;
    const query: Record<string, unknown> = { slug: candidate };

    if (ignoreId && isValidObjectId(ignoreId)) {
      query._id = { $ne: new mongoose.Types.ObjectId(ignoreId) };
    }

    const exists = await ArticleModel.exists(query);

    if (!exists) {
      return candidate;
    }

    suffix++;
  }

  return `${baseSlug}-${Date.now()}`;
}

export async function buildArticlePayload(
  input: ArticleMutationInput,
  existing?: Article
): Promise<{ payload?: ArticlePayload; errors: string[] }> {
  const title = stringValue(input.title) || existing?.title || "";
  const content = stringValue(input.content) || existing?.content || "";
  const categoryInput = stringValue(input.category) || existing?.category || "";
  const category = CATEGORIES.find((item) => item === categoryInput);
  const statusInput = stringValue(input.status) || existing?.status || "draft";
  const status: ArticleStatus = statusInput === "draft" ? "draft" : "published";
  const summary =
    stringValue(input.summary) || existing?.summary || excerptFromContent(content);
  const publishedAtInput = stringValue(input.publishedAt) || existing?.publishedAt;
  const publishedAt = publishedAtInput ? new Date(publishedAtInput) : new Date();
  const errors: string[] = [];

  if (!title) {
    errors.push("Title is required.");
  }

  if (!content) {
    errors.push("Article content is required.");
  }

  if (!category) {
    errors.push("Choose a valid category.");
  }

  if (errors.length > 0 || !category) {
    return { errors };
  }

  const slug = await getUniqueSlug(
    title,
    stringValue(input.slug) || existing?.slug,
    existing?._id
  );

  return {
    errors: [],
    payload: {
      title,
      slug,
      summary,
      content,
      category,
      image: stringValue(input.image) || existing?.image || "",
      author: stringValue(input.author) || existing?.author || "VIDARBHA PRINT Desk",
      isBreaking: booleanValue(input.isBreaking),
      isFeatured: booleanValue(input.isFeatured),
      status,
      publishedAt: Number.isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
    },
  };
}

export async function getPublishedArticles(options?: {
  category?: Category | string;
  excludeSlug?: string;
  limit?: number;
  tag?: string;
}) {
  await connectDB();

  const query: Record<string, unknown> = { status: "published" };

  if (options?.category) {
    const categoryValue = options.category;
    if (isValidObjectId(categoryValue)) {
      // Query by ObjectId reference
      query.category = new mongoose.Types.ObjectId(categoryValue);
    } else {
      // Resolve category name to ObjectId via Category collection
      const catDoc = await CategoryModel.findOne({ name: categoryValue });
      if (catDoc) {
        query.category = catDoc._id;
      } else {
        // Category not found — skip filter so we return all published articles
        delete query.category;
      }
    }
  }

  if (options?.tag) {
    // Resolve tag slug to Tag._id (active only), then query by ObjectId reference.
    const tagDoc = await TagModel.findOne({ slug: options.tag, isActive: true });
    if (tagDoc) {
      query.tags = { $in: [tagDoc._id] };
    } else {
      // Tag not found or inactive — return empty array (no articles for this tag)
      return [];
    }
  }

  if (options?.excludeSlug) {
    query.slug = { $ne: options.excludeSlug };
  }

  const articles = await ArticleModel.find(query)
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(options?.limit ?? 50)
    .populate("featuredImage")
    .populate("category")
    .populate("author")
    .populate("tags")
    .lean<ArticleRecord[]>();

  return articles.map(serializeArticle);
}

export async function getArticlesByTag(
  tag: string,
  options?: {
    excludeSlug?: string;
    limit?: number;
  }
) {
  await connectDB();

  const query: Record<string, unknown> = { status: "published" };

  // Resolve tag slug to Tag._id (active only), then query by ObjectId reference.
  const tagDoc = await TagModel.findOne({ slug: tag, isActive: true });
  if (tagDoc) {
    query.tags = { $in: [tagDoc._id] };
  } else {
    // Tag not found or inactive — return empty array (no articles for this tag)
    return [];
  }

  if (options?.excludeSlug) {
    query.slug = { $ne: options.excludeSlug };
  }

  const articles = await ArticleModel.find(query)
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(options?.limit ?? 40)
    .populate('featuredImage')
    .populate('category')
    .populate('author')
    .populate('tags')
    .lean<ArticleRecord[]>();

  return articles.map(serializeArticle);
}

export async function getArticleBySlug(slug: string) {
  await connectDB();

  const article = await ArticleModel.findOne({ slug, status: "published" })
    .populate('featuredImage')
    .populate('category')
    .populate('author')
    .populate('tags')
    .lean<ArticleRecord | null>();

  return article ? serializeArticle(article) : null;
}

export async function getArticleById(id: string) {
  if (!isValidObjectId(id)) {
    return null;
  }

  await connectDB();

  const article = await ArticleModel.findById(id)
    .populate('featuredImage')
    .populate('category')
    .lean<ArticleRecord | null>();

  return article ? serializeArticle(article) : null;
}

export async function getAdminArticles() {
  await connectDB();

  const articles = await ArticleModel.find({})
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(100)
    .populate('featuredImage')
    .populate('category')
    .lean<ArticleRecord[]>();

  return articles.map(serializeArticle);
}

export async function getHomepageArticles() {
  const articles = await getPublishedArticles({ limit: 80 });
  const hero = articles.find((article) => article.isFeatured) ?? articles[0] ?? null;
  const excludeId = hero?._id;
  const latest = articles
    .filter((article) => article._id !== excludeId)
    .slice(0, 12);
  const breaking = articles
    .filter((article) => article.isBreaking && article._id !== excludeId)
    .slice(0, 8);
  const byCategory = CATEGORIES.reduce(
    (sections, category) => ({
      ...sections,
      [category]: articles
        .filter((article) => article.category === category && article._id !== excludeId)
        .slice(0, 4),
    }),
    {} as Record<Category, Article[]>
  );

  return {
    hero,
    latest,
    breaking,
    byCategory,
  };
}
