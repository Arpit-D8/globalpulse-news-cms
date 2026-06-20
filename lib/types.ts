import { CATEGORIES } from "@/lib/constants";

export type Category = (typeof CATEGORIES)[number];

export type ArticleStatus = "draft" | "published";

export type Article = {
  _id: string;
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
