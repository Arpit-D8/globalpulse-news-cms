import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Mongoose schema for the Author entity.
 *
 * Authors represent writers, journalists, or editorial contributors associated
 * with published articles. Unlike categories and tags, authors are identity
 * entities that carry profile information (bio, photo, social links) rather
 * than classification metadata.
 */
const AuthorSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "Author name must be at least 2 characters"],
      maxlength: [120, "Author name must be at most 120 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: [2000, "Bio must be at most 2000 characters"],
    },
    photoUrl: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
      maxlength: [254, "Email must be at most 254 characters"],
    },
    twitterHandle: {
      type: String,
      default: "",
      trim: true,
      maxlength: [20, "Twitter handle must be at most 20 characters"],
    },
    websiteUrl: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

AuthorSchema.index({ name: 1 });
AuthorSchema.index({ email: 1 });
AuthorSchema.index({ isActive: 1, name: 1 });

export type AuthorDocument = InferSchemaType<typeof AuthorSchema> & {
  _id: string;
};

const Author =
  (mongoose.models.Author as Model<AuthorDocument> | undefined) ??
  mongoose.model<AuthorDocument>("Author", AuthorSchema);

export default Author;
