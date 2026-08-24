import Category from "@/models/Category";
import type { CategoryDocument } from "@/models/Category";
import { connectDB } from "@/lib/mongodb";
import { validateCategoryInput } from "@/lib/validations/category";
import { ValidationError, NotFoundError } from "@/lib/errors";
import type { Category as CategoryType, CategoryCreateInput } from "@/lib/types/category";

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Convert a Mongoose document to the plain Category type.
 *
 * Mongoose uses ObjectId for _id, but the Category type expects string.
 * This helper performs the conversion explicitly.
 */
function toCategory(doc: CategoryDocument): CategoryType {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    color: doc.color,
    icon: doc.icon,
    displayOrder: doc.displayOrder,
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/**
 * Convert a Mongoose lean document to the plain Category type.
 *
 * Lean documents return _id as ObjectId, so we convert it to string.
 */
function toLeanCategory(doc: ReturnType<typeof Category.prototype.toObject>): CategoryType {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    color: doc.color,
    icon: doc.icon,
    displayOrder: doc.displayOrder,
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/**
 * Fetch a category by _id and throw NotFoundError if absent.
 */
async function getCategoryOrThrow(id: string): Promise<CategoryDocument> {
  const doc = await Category.findById(id);
  if (!doc) {
    throw new NotFoundError(`Category with id ${id} not found`);
  }
  return doc;
}

/**
 * Validate input and throw ValidationError on failure.
 *
 * When updating, the caller must include the current name (or this function
 * will use the fallback name from the existing document — see updateCategory).
 */
function validateCategoryOrThrow(input: Record<string, unknown>): CategoryCreateInput {
  const result = validateCategoryInput(input);

  if (!result.success) {
    throw new ValidationError("Category input validation failed", {
      details: result.errors,
    });
  }

  return result.data;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Create a new category.
 *
 * Validates input, generates a unique slug, and persists the document.
 * Returns the created category with all fields populated.
 */
export async function createCategory(
  input: Record<string, unknown>
): Promise<CategoryType> {
  const validated = validateCategoryOrThrow(input);

  await connectDB();

  const { slug, ...rest } = validated;
  const uniqueSlug = await generateUniqueSlug(slug);

  const doc = await Category.create({
    ...rest,
    slug: uniqueSlug,
  });

  return toCategory(doc);
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

/**
 * Update an existing category by its _id.
 *
 * Partial update — only provided fields are modified. Slug is regenerated
 * only if the name changed.
 */
export async function updateCategory(
  id: string,
  input: Record<string, unknown>
): Promise<CategoryType> {
  await connectDB();

  const existing = await getCategoryOrThrow(id);

  // Build a validation input that includes the current name (in case name
  // is not provided in the update payload).
  const validationInput: Record<string, unknown> = {
    ...input,
    name: input.name ?? existing.name,
  };

  const validated = validateCategoryOrThrow(validationInput);

  const { slug, ...rest } = validated;

  // Regenerate slug only when the name changed.
  const effectiveSlug =
    String(input.name ?? "").trim() !== existing.name.trim()
      ? await generateUniqueSlug(slug)
      : existing.slug;

  const updated = await Category.findByIdAndUpdate(
    id,
    { ...rest, slug: effectiveSlug },
    { new: true, runValidators: false } // runValidators: false because we already validated
  ).lean();

  if (!updated) {
    throw new NotFoundError(`Category with id ${id} not found`);
  }

  return toLeanCategory(updated);
}

// ---------------------------------------------------------------------------
// Delete (soft-delete via isActive toggle)
// ---------------------------------------------------------------------------

/**
 * Soft-delete a category by setting isActive to false.
 *
 * Returns the updated document, or throws if not found.
 */
export async function deleteCategory(id: string): Promise<CategoryType> {
  await connectDB();

  const updated = await Category.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  ).lean();

  if (!updated) {
    throw new NotFoundError(`Category with id ${id} not found`);
  }

  return toLeanCategory(updated);
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Retrieve a single category by its _id, throwing NotFoundError if absent.
 */
export async function getCategoryByIdOrThrow(
  id: string
): Promise<CategoryType> {
  await connectDB();

  const doc = await getCategoryOrThrow(id);
  return toCategory(doc);
}

/**
 * Retrieve a single category by its _id.
 */
export async function getCategoryById(
  id: string
): Promise<CategoryType | null> {
  await connectDB();

  const category = await Category.findById(id).lean();
  return category ? toLeanCategory(category) : null;
}

/**
 * Retrieve a single category by its slug.
 */
export async function getCategoryBySlug(
  slug: string
): Promise<CategoryType | null> {
  await connectDB();

  const category = await Category.findOne({ slug }).lean();
  return category ? toLeanCategory(category) : null;
}

/**
 * Retrieve all categories, optionally filtered by isActive.
 *
 * Returns results sorted by displayOrder ascending.
 * Uses projection to load only the fields needed for list display.
 */
export async function getAllCategories({
  isActive,
}: {
  isActive?: boolean;
} = {}): Promise<CategoryType[]> {
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (isActive !== undefined) {
    filter.isActive = isActive;
  }

  const categories = await Category.find(filter)
    .sort({ displayOrder: 1, name: 1 })
    .select("_id name slug description color icon displayOrder isActive createdAt updatedAt")
    .lean();

  return categories.map(toLeanCategory);
}

// ---------------------------------------------------------------------------
// Paginated list (admin)
// ---------------------------------------------------------------------------

/**
 * Query parameters for the paginated category list.
 */
export type CategoryListQuery = {
  /** Substring match on name or slug (case-insensitive). */
  search?: string;
  /** Page number (default 1). */
  page?: number;
  /** Items per page (default 10). */
  limit?: number;
  /** Optional isActive filter. */
  isActive?: boolean;
};

/**
 * Pagination metadata returned by listCategories.
 */
export type CategoryPagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

/**
 * Result shape for the paginated category list.
 */
export type CategoryListResult = {
  categories: CategoryType[];
  pagination: CategoryPagination;
};

/**
 * List categories with search, filter, and pagination.
 *
 * Returns results sorted by displayOrder ascending, then name.
 */
export async function listCategories({
  search = "",
  page = 1,
  limit = 10,
  isActive,
}: CategoryListQuery = {}): Promise<CategoryListResult> {
  await connectDB();

  // Build query filter.
  const filter: Record<string, unknown> = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } },
    ];
  }

  if (isActive !== undefined) {
    filter.isActive = isActive;
  }

  // Fetch paginated categories.
  const [categories, total] = await Promise.all([
    Category.find(filter)
      .sort({ displayOrder: 1, name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("_id name slug description color icon displayOrder isActive createdAt updatedAt")
      .lean(),
    Category.countDocuments(filter),
  ]);

  return {
    categories: categories.map(toLeanCategory),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Toggle the isActive status of a category.
 *
 * Returns the updated document, or throws if not found.
 */
export async function toggleCategoryStatus(id: string): Promise<CategoryType> {
  await connectDB();

  const existing = await getCategoryOrThrow(id);

  const updated = await Category.findByIdAndUpdate(
    id,
    { isActive: !existing.isActive },
    { new: true }
  ).lean();

  if (!updated) {
    throw new NotFoundError(`Category with id ${id} not found`);
  }

  return toLeanCategory(updated);
}

/**
 * Reorder categories by setting explicit displayOrder values.
 *
 * @param reorders - Array of { id, displayOrder } pairs.
 * @returns Array of updated category documents.
 */
export async function reorderCategories(
  reorders: Array<{ id: string; displayOrder: number }>
): Promise<CategoryType[]> {
  if (reorders.length === 0) {
    return [];
  }

  await connectDB();

  const bulkOps = reorders.map(({ id, displayOrder }) => ({
    updateOne: {
      filter: { _id: id },
      update: { displayOrder },
    },
  }));

  await Category.bulkWrite(bulkOps);

  const ids = reorders.map((r) => r.id);
  const updated = await Category.find({ _id: { $in: ids } })
    .sort({ displayOrder: 1 })
    .lean();

  return updated.map(toLeanCategory);
}

/**
 * Check whether a category with the given name or slug already exists.
 *
 * When both name and slug are supplied, uses $or to check either condition.
 * Returns true if at least one match is found.
 */
export async function categoryExists(
  name?: string,
  slug?: string
): Promise<boolean> {
  await connectDB();

  const filter: Record<string, string> = {};
  if (name) filter.name = name.trim();
  if (slug) filter.slug = slug.trim();

  if (Object.keys(filter).length === 0) {
    return false;
  }

  // When both name and slug are provided, use $or for flexible matching.
  if (name && slug) {
    const exists = await Category.exists({
      $or: [{ name: name.trim() }, { slug: slug.trim() }],
    });
    return !!exists;
  }

  const exists = await Category.exists(filter);
  return !!exists;
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Generate a unique slug by appending a numeric suffix if necessary.
 *
 * e.g. "politics" → "politics" → "politics-1" → "politics-2" …
 */
export async function generateUniqueSlug(baseSlug: string): Promise<string> {
  if (!baseSlug) {
    throw new ValidationError("Slug cannot be empty");
  }

  await connectDB();

  let candidate = baseSlug;
  let suffix = 1;

  // Check for existing category with the same slug (any status).
  while (await Category.exists({ slug: candidate })) {
    candidate = `${baseSlug}-${suffix}`;
    suffix++;
  }

  return candidate;
}
