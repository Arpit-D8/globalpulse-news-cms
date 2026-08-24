import { CATEGORIES } from "@/lib/constants";

export type Category = (typeof CATEGORIES)[number];

/**
 * Minimal tag DTO exposed on public Article read paths.
 *
 * Populated from populated Tag Mongoose refs ({ _id, name, slug }).
 * Mutation inputs still use string[] (ObjectId strings).
 */
export type ArticleTag = {
  /** MongoDB ObjectId string. */
  _id: string;
  /** Human-readable tag name. */
  name: string;
  /** URL-friendly slug (used for /tags/${slug} links). */
  slug: string;
};

export type ArticleStatus = "draft" | "published" | "archived";

export type Article = {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: Category;
  image: string;
  author: string;
  tags: ArticleTag[];
  isBreaking: boolean;
  isFeatured: boolean;
  status: ArticleStatus;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ArticleMutationInput = {
  title?: unknown;
  slug?: unknown;
  summary?: unknown;
  content?: unknown;
  category?: unknown;
  image?: unknown;
  author?: unknown;
  isBreaking?: unknown;
  isFeatured?: unknown;
  status?: unknown;
  publishedAt?: unknown;
};
