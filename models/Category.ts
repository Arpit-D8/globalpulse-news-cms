import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const CategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "Category name must be at least 2 characters"],
      maxlength: [80, "Category name must be at most 80 characters"],
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
    color: {
      type: String,
      default: "#6b7280",
      trim: true,
    },
    icon: {
      type: String,
      default: "",
      trim: true,
    },
    displayOrder: {
      type: Number,
      required: true,
      min: [0, "Display order must be >= 0"],
      default: 0,
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

CategorySchema.index({ name: 1 });
CategorySchema.index({ displayOrder: 1, isActive: 1 });

export type CategoryDocument = InferSchemaType<typeof CategorySchema> & {
  _id: string;
};

const Category =
  (mongoose.models.Category as Model<CategoryDocument> | undefined) ??
  mongoose.model<CategoryDocument>("Category", CategorySchema);

export default Category;
