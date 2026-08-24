import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Mongoose schema for the Tag entity.
 *
 * Tags are used to classify articles by topic, keyword, or subject matter.
 * Unlike categories, tags are flat, non-hierarchical, and do not require
 * ordering or visual customisation (color/icon).
 */
const TagSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "Tag name must be at least 2 characters"],
      maxlength: [80, "Tag name must be at most 80 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Description must be at most 500 characters"],
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

TagSchema.index({ name: 1 });
TagSchema.index({ isActive: 1 });
TagSchema.index({ isActive: 1, name: 1 });

export type TagDocument = InferSchemaType<typeof TagSchema> & {
  _id: string;
};

const Tag =
  (mongoose.models.Tag as Model<TagDocument> | undefined) ??
  mongoose.model<TagDocument>("Tag", TagSchema);

export default Tag;
