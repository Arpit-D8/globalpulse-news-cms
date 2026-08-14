import { CATEGORIES } from "@/lib/constants";

/**
 * Category values accepted by the Article schema.
 */
export type ArticleCategory = (typeof CATEGORIES)[number];

/**
 * Valid article statuses.
 *
 * Mirrors the Mongoose schema enum: draft, published, archived.
 */
export type ArticleStatus = "draft" | "published" | "archived";

/**
 * Article entity as returned by API routes (plain object, no Mongoose).
 *
 * References (author, category, featuredImage) are stored as ObjectId strings
 * in MongoDB but are serialised as plain strings in the DTO.
 */
export type Article = {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string; // Category _id (ObjectId string)
  author: string; // Author _id (ObjectId string)
  featuredImage: string; // Media _id (ObjectId string)
  tags: string[];
  status: ArticleStatus;
  isBreaking: boolean;
  isFeatured: boolean;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  publishedAt: string;
  viewCount: number;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * Validated input used when creating an article.
 *
 * Values are normalised and defaulted by the validation layer before reaching
 * the service layer.  Field names match ArticleForm (authorId, categoryId,
 * featuredImageId) — the admin API routes transform them to Mongoose names.
 */
export type ArticleCreateInput = {
  title: string;
  slug: string;
  summary: string;
  content: string;
  categoryId: string;
  authorId: string;
  featuredImageId: string;
  tags: string[];
  status: ArticleStatus;
  isBreaking: boolean;
  isFeatured: boolean;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  publishedAt?: string;
};

/**
 * Discriminated union representing the result of article input validation.
 *
 * When success is true, data contains the validated and sanitised input.
 * When success is false, errors contains field-level validation messages.
 */
export type ArticleValidationResult =
  | {
      success: true;
      data: ArticleCreateInput;
    }
  | {
      success: false;
      errors: Record<string, string>;
    };

/**
 * Service-layer input for updating an article.
 *
 * Uses Mongoose-compatible field names (author, category, featuredImage)
 * rather than ArticleForm names (authorId, categoryId, featuredImageId).
 * All fields are optional to support partial updates.
 */
export type ArticleUpdateServiceInput = {
  title?: string;
  slug?: string;
  summary?: string;
  content?: string;
  author?: string;
  category?: string;
  featuredImage?: string;
  tags?: string[];
  status?: ArticleStatus;
  isBreaking?: boolean;
  isFeatured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  publishedAt?: Date;
};
