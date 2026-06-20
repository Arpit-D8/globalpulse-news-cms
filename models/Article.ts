import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { CATEGORIES } from "@/lib/constants";

const ArticleSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
      maxlength: 320,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [...CATEGORIES],
      required: true,
    },
    image: {
      type: String,
      default: "",
      trim: true,
    },
    author: {
      type: String,
      default: "GlobalPulse Desk",
      trim: true,
    },
    isBreaking: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

ArticleSchema.index({ category: 1, status: 1, publishedAt: -1 });
ArticleSchema.index({ isBreaking: 1, status: 1, publishedAt: -1 });
ArticleSchema.index({ isFeatured: 1, status: 1, publishedAt: -1 });

export type ArticleDocument = InferSchemaType<typeof ArticleSchema>;

const Article =
  (mongoose.models.Article as Model<ArticleDocument> | undefined) ??
  mongoose.model<ArticleDocument>("Article", ArticleSchema);

export default Article;
