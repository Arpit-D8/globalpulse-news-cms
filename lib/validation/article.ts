import { z } from "zod";

/**
 * Valid article statuses.
 *
 * Mirrors the Mongoose schema enum: draft, published, archived.
 */
const ARTICLE_STATUSES = z.enum(["draft", "published", "archived"]);

// ---------------------------------------------------------------------------
// Article — Create
// ---------------------------------------------------------------------------

/**
 * Schema for creating a new article.
 *
 * Accepts the field names emitted by ArticleForm (authorId, categoryId,
 * featuredImageId, tags, seoTitle, seoDescription, canonicalUrl).  The admin
 * API routes transform these into Mongoose-compatible names (author,
 * category, featuredImage) before persisting.
 */
export const articleCreateSchema = z
  .object({
    title: z
      .string()
      .min(3, "Headline must be at least 3 characters")
      .max(500, "Headline must be at most 500 characters"),
    slug: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^[a-z0-9]+(-[a-z0-9]+)*$/.test(val),
        "Slug can only contain lowercase letters, numbers, and hyphens"
      ),
    summary: z
      .string()
      .max(500, "Summary must be at most 500 characters")
      .optional()
      .default(""),
    content: z
      .string()
      .min(10, "Article body must be at least 10 characters"),
    categoryId: z
      .string()
      .min(1, "Category is required"),
    authorId: z
      .string()
      .min(1, "Author is required"),
    featuredImageId: z
      .string()
      .optional()
      .default(""),
    tags: z
      .array(
        z
          .string()
          .max(50, "Tag must be at most 50 characters")
      )
      .optional()
      .default([]),
    status: z.enum(["draft", "published", "archived"]).default("draft" as const),
    isBreaking: z.boolean().optional().default(false),
    isFeatured: z.boolean().optional().default(false),
    seoTitle: z
      .string()
      .max(120, "SEO title must be at most 120 characters")
      .optional()
      .default(""),
    seoDescription: z
      .string()
      .max(200, "SEO description must be at most 200 characters")
      .optional()
      .default(""),
    canonicalUrl: z
      .string()
      .max(2048, "Canonical URL must be at most 2048 characters")
      .optional()
      .default(""),
    publishedAt: z.string().datetime().optional(),
  });

/**
 * Infer the TypeScript type for article create input.
 */
export type ArticleCreateInput = z.infer<typeof articleCreateSchema>;

// ---------------------------------------------------------------------------
// Article — Update (partial)
// ---------------------------------------------------------------------------

/**
 * Schema for updating an existing article.
 *
 * Every field is optional so callers can perform partial updates.
 * Accepts ArticleForm field names (authorId, categoryId, featuredImageId,
 * tags, seoTitle, seoDescription, canonicalUrl).
 */
export const articleUpdateSchema = z
  .object({
    title: z
      .string()
      .min(3, "Headline must be at least 3 characters")
      .max(500, "Headline must be at most 500 characters")
      .optional(),
    slug: z
      .string()
      .refine(
        (val) => !val || /^[a-z0-9]+(-[a-z0-9]+)*$/.test(val),
        "Slug can only contain lowercase letters, numbers, and hyphens"
      )
      .optional(),
    summary: z
      .string()
      .max(500, "Summary must be at most 500 characters")
      .optional(),
    content: z
      .string()
      .min(10, "Article body must be at least 10 characters")
      .optional(),
    categoryId: z
      .string()
      .optional(),
    authorId: z
      .string()
      .optional(),
    featuredImageId: z
      .string()
      .optional(),
    tags: z
      .array(
        z
          .string()
          .max(50, "Tag must be at most 50 characters")
      )
      .optional(),
    status: ARTICLE_STATUSES.optional(),
    isBreaking: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    seoTitle: z
      .string()
      .max(120, "SEO title must be at most 120 characters")
      .optional(),
    seoDescription: z
      .string()
      .max(200, "SEO description must be at most 200 characters")
      .optional(),
    canonicalUrl: z
      .string()
      .max(2048, "Canonical URL must be at most 2048 characters")
      .optional(),
    publishedAt: z.string().datetime().optional(),
  })
  .strict()
  .partial();

/**
 * Infer the TypeScript type for article update input.
 */
export type ArticleUpdateInput = z.infer<typeof articleUpdateSchema>;
