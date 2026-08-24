import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Mongoose schema for the Article entity.
 *
 * Articles represent published or draft news pieces. Each article references
 * its author, category, and featured image through Mongoose ObjectId
 * references, stores optional SEO metadata, and tracks publication lifecycle
 * (status, publishedAt, viewCount, readingTime).
 *
 * Fields:
 *   title          — Article headline (required, trimmed)
 *   slug           — URL-friendly identifier (required, unique, lowercase)
 *   summary        — Short excerpt (required)
 *   content        — Full article body (required)
 *   featuredImage  — Reference to a Media document
 *   author         — Reference to an Author document
 *   category       — Reference to a Category document
 *   tags           — References to Tag documents (ObjectId array)
 *   status         — Lifecycle state (draft | published | archived)
 *   isFeatured     — Whether the article is featured on the homepage
 *   seoTitle       — Optional override for the HTML <title> tag
 *   seoDescription — Optional override for the meta description
 *   canonicalUrl   — Optional canonical URL for SEO
 *   publishedAt    — Optional publication timestamp
 *   viewCount      — Number of times the article has been viewed
 *   readingTime    — Estimated reading time in minutes
 *   createdBy      — Optional reference to the user who created the article
 *   updatedBy      — Optional reference to the user who last updated it
 */
const ArticleSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, "Title must be at most 500 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [800, "Slug must be at most 800 characters"],
    },
    summary: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, "Summary must be at most 500 characters"],
    },
    content: {
      type: String,
      required: true,
    },
    featuredImage: {
      type: Schema.Types.ObjectId,
      ref: "Media",
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "Author",
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    isBreaking: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    seoTitle: {
      type: String,
      trim: true,
      maxlength: [120, "SEO title must be at most 120 characters"],
    },
    seoDescription: {
      type: String,
      trim: true,
      maxlength: [200, "SEO description must be at most 200 characters"],
    },
    canonicalUrl: {
      type: String,
      trim: true,
      maxlength: [2048, "Canonical URL must be at most 2048 characters"],
    },
    publishedAt: {
      type: Date,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: [0, "View count must be non-negative"],
    },
    readingTime: {
      type: Number,
      default: 0,
      min: [0, "Reading time must be non-negative"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common query patterns.
// Note: slug already has unique: true (implicit unique index).
ArticleSchema.index({ status: 1 });
ArticleSchema.index({ category: 1, status: 1 });
ArticleSchema.index({ author: 1, status: 1 });
ArticleSchema.index({ publishedAt: -1 });
ArticleSchema.index({ status: 1, isFeatured: 1, publishedAt: -1 });
ArticleSchema.index({ status: 1, publishedAt: -1 });

// Additional indexes for frequently queried fields.
ArticleSchema.index({ isBreaking: 1 });
ArticleSchema.index({ createdAt: -1 });
ArticleSchema.index({ tags: 1 });
ArticleSchema.index({ author: 1 });

// Text search index for title and summary fields.
ArticleSchema.index({ title: "text", summary: "text" });

export type ArticleDocument = InferSchemaType<typeof ArticleSchema> & {
  _id: string;
};

const Article =
  (mongoose.models.Article as Model<ArticleDocument> | undefined) ??
  mongoose.model<ArticleDocument>("Article", ArticleSchema);

export default Article;
