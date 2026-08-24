import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Mongoose schema for the Media entity.
 *
 * Media represents uploaded assets (images, videos, documents) referenced by
 * articles or other content. Each document stores the cloud provider metadata
 * (public ID, URL, dimensions, format, size) along with an optional alt text
 * and the identity of the uploader.
 *
 * Fields:
 *   publicId   — Cloudinary (or equivalent) asset public identifier
 *   url        — Full public URL to the asset
 *   width      — Rendered width in pixels
 *   height     — Rendered height in pixels
 *   format     — File extension / MIME subtype (e.g. "jpg", "png", "mp4")
 *   bytes      — Raw file size in bytes
 *   alt        — Accessibility alt text
 *   createdBy  — Uploader identity (default "Admin")
 */
const MediaSchema = new Schema(
  {
    publicId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [256, "Public ID must be at most 256 characters"],
    },
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2048, "URL must be at most 2048 characters"],
    },
    width: {
      type: Number,
      required: true,
      min: [1, "Width must be at least 1"],
    },
    height: {
      type: Number,
      required: true,
      min: [1, "Height must be at least 1"],
    },
    format: {
      type: String,
      required: true,
      trim: true,
      maxlength: [20, "Format must be at most 20 characters"],
    },
    bytes: {
      type: Number,
      required: true,
      min: [0, "File size must be non-negative"],
    },
    alt: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Alt text must be at most 500 characters"],
    },
    createdBy: {
      type: String,
      default: "Admin",
      trim: true,
      maxlength: [120, "Creator identity must be at most 120 characters"],
    },
  },
  {
    timestamps: true,
  }
);

MediaSchema.index({ format: 1, createdAt: -1 });
MediaSchema.index({ createdBy: 1 });
MediaSchema.index({ alt: 1 });
MediaSchema.index({ createdAt: -1 });

export type MediaDocument = InferSchemaType<typeof MediaSchema> & {
  _id: string;
};

const Media =
  (mongoose.models.Media as Model<MediaDocument> | undefined) ??
  mongoose.model<MediaDocument>("Media", MediaSchema);

export default Media;
