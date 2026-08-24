/**
 * Admin-specific article types used by presentational components.
 *
 * These types differ from the client-side `Article` type in `lib/types/article.ts`:
 * - Author and Category are populated objects (not string IDs)
 * - `featuredImage` is a URL string (not an ObjectId reference)
 * - Includes "archived" as a valid status
 *
 * The admin page component resolves Mongoose ObjectId references to populated
 * objects before passing data to these presentational components.
 *
 * NOTE: The minimal author/category shapes here are named ArticleAuthor /
 * ArticleCategory to distinguish them from the full AdminAuthor / AdminCategory
 * types defined in lib/types/admin-author.ts and lib/types/admin-category.ts.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Minimal author shape passed through props.
 *
 * Captures only the fields the admin row component needs from a populated
 * author reference.
 */
export type ArticleAuthor = {
  _id: string;
  name: string;
  photoUrl?: string;
};

/**
 * Minimal category shape passed through props.
 *
 * Captures only the fields the admin row component needs from a populated
 * category reference.
 */
export type ArticleCategory = {
  _id: string;
  name: string;
};

/**
 * A single article document as returned by the admin API.
 *
 * Populated references (author, category) and a string URL for the featured
 * image. Includes "archived" as a valid status.
 */
export type AdminArticle = {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  featuredImage?: string;
  author: ArticleAuthor;
  category: ArticleCategory;
  status: "draft" | "published" | "archived";
  isFeatured: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Valid article statuses used in the admin interface.
 */
export type AdminArticleStatus = AdminArticle["status"];

/**
 * Status label mapping for display in the admin table.
 */
export const STATUS_LABELS: Record<AdminArticleStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
} as const;
