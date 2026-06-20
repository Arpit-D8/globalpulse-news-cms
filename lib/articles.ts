import mongoose, { isValidObjectId } from "mongoose";
import ArticleModel from "@/models/Article";
import { CATEGORIES } from "@/lib/constants";
import { connectDB } from "@/lib/mongodb";
import type {
  Article,
  ArticleMutationInput,
  ArticleStatus,
  Category,
} from "@/lib/types";

type ObjectIdLike = {
  toString(): string;
};

type ArticleRecord = {
  _id: ObjectIdLike;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: Category;
  image?: string | null;
  author?: string | null;
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

  return {
    _id: article._id.toString(),
    title: article.title,
    slug: article.slug,
    summary: article.summary,
    content: article.content,
    category: article.category,
    image: article.image ?? "",
    author: article.author ?? "GlobalPulse Desk",
    isBreaking: Boolean(article.isBreaking),
    isFeatured: Boolean(article.isFeatured),
    status: article.status ?? "published",
    publishedAt: toIsoDate(article.publishedAt, createdAt),
    createdAt,
    updatedAt: toIsoDate(article.updatedAt, createdAt),
  };
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export async function getUniqueSlug(
  title: string,
  requestedSlug?: string,
  ignoreId?: string
) {
  await connectDB();

  const baseSlug = slugify(requestedSlug || title) || `article-${Date.now()}`;
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const query: Record<string, unknown> = { slug };

    if (ignoreId && isValidObjectId(ignoreId)) {
      query._id = { $ne: new mongoose.Types.ObjectId(ignoreId) };
    }

    const exists = await ArticleModel.exists(query);

    if (!exists) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

export async function buildArticlePayload(
  input: ArticleMutationInput,
  existing?: Article
): Promise<{ payload?: ArticlePayload; errors: string[] }> {
  const title = stringValue(input.title) || existing?.title || "";
  const content = stringValue(input.content) || existing?.content || "";
  const categoryInput = stringValue(input.category) || existing?.category || "";
  const category = CATEGORIES.find((item) => item === categoryInput);
  const statusInput = stringValue(input.status) || existing?.status || "published";
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
      author: stringValue(input.author) || existing?.author || "GlobalPulse Desk",
      isBreaking: booleanValue(input.isBreaking),
      isFeatured: booleanValue(input.isFeatured),
      status,
      publishedAt: Number.isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
    },
  };
}

export async function getPublishedArticles(options?: {
  category?: Category;
  excludeSlug?: string;
  limit?: number;
}) {
  await connectDB();

  const query: Record<string, unknown> = { status: "published" };

  if (options?.category) {
    query.category = options.category;
  }

  if (options?.excludeSlug) {
    query.slug = { $ne: options.excludeSlug };
  }

  const articles = await ArticleModel.find(query)
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(options?.limit ?? 50)
    .lean<ArticleRecord[]>();

  return articles.map(serializeArticle);
}

export async function getArticleBySlug(slug: string) {
  await connectDB();

  const article = await ArticleModel.findOne({ slug, status: "published" }).lean<
    ArticleRecord | null
  >();

  return article ? serializeArticle(article) : null;
}

export async function getArticleById(id: string) {
  if (!isValidObjectId(id)) {
    return null;
  }

  await connectDB();

  const article = await ArticleModel.findById(id).lean<ArticleRecord | null>();

  return article ? serializeArticle(article) : null;
}

export async function getAdminArticles() {
  await connectDB();

  const articles = await ArticleModel.find({})
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(100)
    .lean<ArticleRecord[]>();

  return articles.map(serializeArticle);
}

export async function getHomepageArticles() {
  const articles = await getPublishedArticles({ limit: 80 });
  const hero = articles.find((article) => article.isFeatured) ?? articles[0] ?? null;
  const latest = articles
    .filter((article) => article._id !== hero?._id)
    .slice(0, 12);
  const breaking = articles.filter((article) => article.isBreaking).slice(0, 8);
  const byCategory = CATEGORIES.reduce(
    (sections, category) => ({
      ...sections,
      [category]: articles
        .filter((article) => article.category === category)
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
