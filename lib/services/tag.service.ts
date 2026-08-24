import { type HydratedDocument } from "mongoose";
import Tag from "@/models/Tag";
import type { TagDocument } from "@/models/Tag";
import { connectDB } from "@/lib/mongodb";
import { validateTagInput } from "@/lib/validations/tag";
import { ValidationError, NotFoundError, ConflictError } from "@/lib/errors";
import type { Tag as TagType, TagCreateInput, TagFilter } from "@/lib/types/tag";
import type { PaginationInfo } from "@/lib/types/pagination";
import { sanitizePagination } from "@/lib/utils/pagination";
import { escapeRegExp } from "@/lib/utils/string";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Pagination query parameters for tag listing.
 */
export type TagListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
};

/**
 * Result of a paginated tag listing operation.
 */
export type TagListResult = {
  tags: TagType[];
  pagination: PaginationInfo;
};

/**
 * Plain object shape returned by Mongoose lean queries.
 *
 * Mongoose infers _id as string from the schema, and adds internal
 * timestamp/version properties. This type captures the common fields
 * we read in toLeanTag.
 */
type TagLeanObject = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
} & Record<string, unknown>;

/**
 * Convert a Mongoose document to the plain Tag type.
 *
 * Mongoose uses ObjectId for _id, but the Tag type expects string.
 * This helper performs the conversion explicitly.
 */
function toTag(doc: HydratedDocument<TagDocument>): TagType {
  const obj = doc.toObject();
  return {
    _id: obj._id.toString(),
    name: obj.name,
    slug: obj.slug,
    description: obj.description,
    isActive: obj.isActive,
    createdAt: obj.createdAt.toISOString(),
    updatedAt: obj.updatedAt.toISOString(),
  };
}

/**
 * Convert a Mongoose lean document to the plain Tag type.
 *
 * Lean documents return _id as ObjectId, so we convert it to string.
 */
function toLeanTag(doc: TagLeanObject): TagType {
  return {
    _id: doc._id,
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    isActive: doc.isActive,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt,
  };
}

/**
 * Fetch a tag by _id and throw NotFoundError if absent.
 */
async function getTagOrThrow(
  id: string
): Promise<HydratedDocument<TagDocument>> {
  const doc = await Tag.findById(id);
  if (!doc) {
    throw new NotFoundError(`Tag with id ${id} not found`);
  }
  return doc;
}

/**
 * Validate input and throw ValidationError on failure.
 *
 * When updating, the caller must include the current name (or this function
 * will use the fallback name from the existing document — see updateTag).
 */
function validateTagOrThrow(input: Record<string, unknown>): TagCreateInput {
  const result = validateTagInput(input);

  if (!result.success) {
    throw new ValidationError("Tag input validation failed", {
      details: result.errors,
    });
  }

  return result.data;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Create a new tag.
 *
 * Validates input, generates a unique slug, and persists the document.
 * Returns the created tag with all fields populated.
 */
export async function createTag(
  input: Record<string, unknown>
): Promise<TagType> {
  const validated = validateTagOrThrow(input);

  await connectDB();

  // Prevent duplicate tag names (case-insensitive).
  const exists = await Tag.exists({
    name: { $regex: new RegExp(`^${escapeRegExp(validated.name)}$`, "i") },
  });

  if (exists) {
    throw new ConflictError(
      `A tag with name "${validated.name}" already exists`
    );
  }

  const { slug, ...rest } = validated;
  const uniqueSlug = await generateUniqueSlug(slug);

  const doc = await Tag.create({
    ...rest,
    slug: uniqueSlug,
  });

  return toTag(doc);
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

/**
 * Update an existing tag by its _id.
 *
 * Partial update — only provided fields are modified. Slug is regenerated
 * only if the name changed.
 */
export async function updateTag(
  id: string,
  input: Record<string, unknown>
): Promise<TagType> {
  await connectDB();

  const existing = await getTagOrThrow(id);

  // Build a validation input that includes the current name (in case name
  // is not provided in the update payload).
  const validationInput: Record<string, unknown> = {
    ...input,
    name: input.name ?? existing.name,
  };

  const validated = validateTagOrThrow(validationInput);

  const { slug, ...rest } = validated;

  // Check for duplicate name when the name is being changed, excluding the
  // current tag itself.
  const nameChanged =
    String(input.name ?? "").trim() !== existing.name.trim();

  if (nameChanged) {
    const exists = await Tag.exists({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${escapeRegExp(validated.name)}$`, "i") },
    });

    if (exists) {
      throw new ConflictError(
        `A tag with name "${validated.name}" already exists`
      );
    }
  }

  // Regenerate slug only when the name changed.
  const effectiveSlug = nameChanged
    ? await generateUniqueSlug(slug)
    : existing.slug;

  const updated = await Tag.findByIdAndUpdate(
    id,
    { ...rest, slug: effectiveSlug },
    { new: true, runValidators: false } // runValidators: false because we already validated
  ).lean();

  if (!updated) {
    throw new NotFoundError(`Tag with id ${id} not found`);
  }

  return toLeanTag(updated);
}

// ---------------------------------------------------------------------------
// Delete (soft-delete via isActive toggle)
// ---------------------------------------------------------------------------

/**
 * Soft-delete a tag by setting isActive to false.
 *
 * Returns the updated document, or throws if not found.
 */
export async function deleteTag(id: string): Promise<TagType> {
  await connectDB();

  const updated = await Tag.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  ).lean();

  if (!updated) {
    throw new NotFoundError(`Tag with id ${id} not found`);
  }

  return toLeanTag(updated);
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Retrieve a single tag by its _id, throwing NotFoundError if absent.
 */
export async function getTagByIdOrThrow(
  id: string
): Promise<TagType> {
  await connectDB();

  const doc = await getTagOrThrow(id);
  return toTag(doc);
}

/**
 * Retrieve a single tag by its _id.
 */
export async function getTagById(
  id: string
): Promise<TagType | null> {
  await connectDB();

  const tag = await Tag.findById(id).lean();
  return tag ? toLeanTag(tag) : null;
}

/**
 * Retrieve a single tag by its slug.
 */
export async function getTagBySlug(
  slug: string
): Promise<TagType | null> {
  await connectDB();

  const tag = await Tag.findOne({ slug }).lean();
  return tag ? toLeanTag(tag) : null;
}

/**
 * Retrieve all tags, optionally filtered by isActive.
 *
 * Returns results sorted by name ascending.
 * Uses projection to load only the fields needed for list display.
 */
export async function getAllTags(filter: TagFilter = {}): Promise<TagType[]> {
  await connectDB();

  const query: Record<string, unknown> = {};
  if (filter.isActive !== undefined) {
    query.isActive = filter.isActive;
  }

  const tags = await Tag.find(query)
    .sort({ name: 1 })
    .select("_id name slug description isActive createdAt updatedAt")
    .lean();

  return tags.map(toLeanTag);
}

/**
 * List tags with search, filter, and pagination.
 *
 * Returns a paginated slice of tags matching the search criteria,
 * sorted by name ascending. Includes pagination metadata.
 */
export async function listTags(query: TagListQuery = {}): Promise<TagListResult> {
  const { page, limit, search = "", isActive } = query;
  const { page: safePage, limit: safeLimit } = sanitizePagination(page, limit);

  await connectDB();

  // Build query filter.
  const filter: Record<string, unknown> = {};
  if (isActive !== undefined) {
    filter.isActive = isActive;
  }

  // Add search filter (case-insensitive substring match across name, slug, description).
  if (search && search.trim().length > 0) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [
      { name: regex },
      { slug: regex },
      { description: regex },
    ];
  }

  // Fetch paginated results with .lean() for performance.
  const [tags, total] = await Promise.all([
    Tag.find(filter)
      .sort({ name: 1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .select("_id name slug description isActive createdAt updatedAt")
      .lean(),
    Tag.countDocuments(filter),
  ]);

  return {
    tags: tags.map(toLeanTag),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit),
    },
  };
}

/**
 * Toggle the isActive status of a tag.
 *
 * Returns the updated document, or throws if not found.
 */
export async function toggleTagStatus(id: string): Promise<TagType> {
  await connectDB();

  const existing = await getTagOrThrow(id);

  const updated = await Tag.findByIdAndUpdate(
    id,
    { isActive: !existing.isActive },
    { new: true }
  ).lean();

  if (!updated) {
    throw new NotFoundError(`Tag with id ${id} not found`);
  }

  return toLeanTag(updated);
}

/**
 * Check whether a tag with the given name or slug already exists.
 *
 * When both name and slug are supplied, uses $or to check either condition.
 * Returns true if at least one match is found.
 */
export async function tagExists(
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
    const exists = await Tag.exists({
      $or: [{ name: name.trim() }, { slug: slug.trim() }],
    });
    return !!exists;
  }

  const exists = await Tag.exists(filter);
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

  // Check for existing tag with the same slug (any status).
  while (await Tag.exists({ slug: candidate })) {
    candidate = `${baseSlug}-${suffix}`;
    suffix++;
  }

  return candidate;
}
