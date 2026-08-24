import { type HydratedDocument } from "mongoose";
import Author from "@/models/Author";
import type { AuthorDocument } from "@/models/Author";
import { connectDB } from "@/lib/mongodb";
import { validateAuthorInput } from "@/lib/validations/author";
import { ValidationError, NotFoundError, ConflictError } from "@/lib/errors";
import type { Author as AuthorType, AuthorCreateInput, AuthorFilter } from "@/lib/types/author";
import type { PaginationInfo } from "@/lib/types/pagination";
import { sanitizePagination } from "@/lib/utils/pagination";
import { escapeRegExp } from "@/lib/utils/string";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Pagination query parameters for author listing.
 */
export type AuthorListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
};

/**
 * Result of a paginated author listing operation.
 */
export type AuthorListResult = {
  authors: AuthorType[];
  pagination: PaginationInfo;
};

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Plain object shape returned by Mongoose lean queries.
 *
 * Mongoose infers _id as string from the schema, and adds internal
 * timestamp/version properties. This type captures the common fields
 * we read in toLeanAuthor.
 */
type AuthorLeanObject = {
  _id: string;
  name: string;
  slug: string;
  bio: string;
  photoUrl: string;
  email: string;
  twitterHandle: string;
  websiteUrl: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
} & Record<string, unknown>;

/**
 * Convert a Mongoose document to the plain Author type.
 *
 * Mongoose uses ObjectId for _id, but the Author type expects string.
 * This helper performs the conversion explicitly.
 */
function toAuthor(doc: HydratedDocument<AuthorDocument>): AuthorType {
  const obj = doc.toObject();
  return {
    _id: obj._id.toString(),
    name: obj.name,
    slug: obj.slug,
    bio: obj.bio,
    photoUrl: obj.photoUrl,
    email: obj.email,
    twitterHandle: obj.twitterHandle,
    websiteUrl: obj.websiteUrl,
    isActive: obj.isActive,
    createdAt: obj.createdAt.toISOString(),
    updatedAt: obj.updatedAt.toISOString(),
  };
}

/**
 * Convert a Mongoose lean document to the plain Author type.
 *
 * Lean documents return _id as ObjectId, so we convert it to string.
 */
function toLeanAuthor(doc: AuthorLeanObject): AuthorType {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    bio: doc.bio,
    photoUrl: doc.photoUrl,
    email: doc.email,
    twitterHandle: doc.twitterHandle,
    websiteUrl: doc.websiteUrl,
    isActive: doc.isActive,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt,
  };
}

/**
 * Fetch an author by _id and throw NotFoundError if absent.
 */
async function getAuthorOrThrow(
  id: string
): Promise<HydratedDocument<AuthorDocument>> {
  const doc = await Author.findById(id);
  if (!doc) {
    throw new NotFoundError(`Author with id ${id} not found`);
  }
  return doc;
}

/**
 * Validate input and throw ValidationError on failure.
 *
 * When updating, the caller must include the current name (or this function
 * will use the fallback name from the existing document — see updateAuthor).
 */
function validateAuthorOrThrow(input: Record<string, unknown>): AuthorCreateInput {
  const result = validateAuthorInput(input);

  if (!result.success) {
    throw new ValidationError("Author input validation failed", {
      details: result.errors,
    });
  }

  return result.data;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Create a new author.
 *
 * Validates input, checks for duplicate name and email, generates a unique
 * slug, and persists the document. Returns the created author with all
 * fields populated.
 */
export async function createAuthor(
  input: Record<string, unknown>
): Promise<AuthorType> {
  const validated = validateAuthorOrThrow(input);

  await connectDB();

  // Prevent duplicate author names (case-insensitive).
  const nameExists = await Author.exists({
    name: { $regex: new RegExp(`^${escapeRegExp(validated.name)}$`, "i") },
  });

  if (nameExists) {
    throw new ConflictError(
      `An author with name "${validated.name}" already exists`
    );
  }

  // Prevent duplicate email addresses (case-insensitive), only when email
  // is non-empty.
  if (validated.email) {
    const emailExists = await Author.exists({
      email: { $regex: new RegExp(`^${escapeRegExp(validated.email)}$`, "i") },
    });

    if (emailExists) {
      throw new ConflictError(
        `An author with email "${validated.email}" already exists`
      );
    }
  }

  const { slug, ...rest } = validated;
  const uniqueSlug = await generateUniqueSlug(slug);

  const doc = await Author.create({
    ...rest,
    slug: uniqueSlug,
  });

  return toAuthor(doc);
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

/**
 * Update an existing author by its _id.
 *
 * Partial update — only provided fields are modified. Slug is regenerated
 * only if the name changed. Duplicate name and email checks exclude the
 * current document.
 */
export async function updateAuthor(
  id: string,
  input: Record<string, unknown>
): Promise<AuthorType> {
  await connectDB();

  const existing = await getAuthorOrThrow(id);

  // Build a validation input that includes the current name (in case name
  // is not provided in the update payload).
  const validationInput: Record<string, unknown> = {
    ...input,
    name: input.name ?? existing.name,
  };

  const validated = validateAuthorOrThrow(validationInput);

  const { slug, ...rest } = validated;

  // Check for duplicate name when the name is being changed, excluding the
  // current author itself.
  const nameChanged =
    String(input.name ?? "").trim() !== existing.name.trim();

  if (nameChanged) {
    const nameExists = await Author.exists({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${escapeRegExp(validated.name)}$`, "i") },
    });

    if (nameExists) {
      throw new ConflictError(
        `An author with name "${validated.name}" already exists`
      );
    }
  }

  // Check for duplicate email when the email is being changed and is
  // non-empty, excluding the current author itself.
  const newEmail = validated.email;
  const oldEmail = existing.email;

  if (newEmail !== oldEmail && newEmail) {
    const emailExists = await Author.exists({
      _id: { $ne: id },
      email: { $regex: new RegExp(`^${escapeRegExp(newEmail)}$`, "i") },
    });

    if (emailExists) {
      throw new ConflictError(
        `An author with email "${newEmail}" already exists`
      );
    }
  }

  // Regenerate slug only when the name changed.
  const effectiveSlug = nameChanged
    ? await generateUniqueSlug(slug)
    : existing.slug;

  const updated = await Author.findByIdAndUpdate(
    id,
    { ...rest, slug: effectiveSlug },
    { new: true, runValidators: false } // runValidators: false because we already validated
  ).lean();

  if (!updated) {
    throw new NotFoundError(`Author with id ${id} not found`);
  }

  return toLeanAuthor(updated);
}

// ---------------------------------------------------------------------------
// Delete (soft-delete via isActive toggle)
// ---------------------------------------------------------------------------

/**
 * Soft-delete an author by setting isActive to false.
 *
 * Returns the updated document, or throws if not found.
 */
export async function deleteAuthor(id: string): Promise<AuthorType> {
  await connectDB();

  const updated = await Author.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  ).lean();

  if (!updated) {
    throw new NotFoundError(`Author with id ${id} not found`);
  }

  return toLeanAuthor(updated);
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Retrieve a single author by its _id, throwing NotFoundError if absent.
 */
export async function getAuthorByIdOrThrow(
  id: string
): Promise<AuthorType> {
  await connectDB();

  const doc = await getAuthorOrThrow(id);
  return toAuthor(doc);
}

/**
 * Retrieve a single author by its _id.
 */
export async function getAuthorById(
  id: string
): Promise<AuthorType | null> {
  await connectDB();

  const author = await Author.findById(id).lean();
  return author ? toLeanAuthor(author) : null;
}

/**
 * Retrieve a single author by its slug.
 */
export async function getAuthorBySlug(
  slug: string
): Promise<AuthorType | null> {
  await connectDB();

  const author = await Author.findOne({ slug }).lean();
  return author ? toLeanAuthor(author) : null;
}

/**
 * Retrieve all authors, optionally filtered by isActive.
 *
 * Returns results sorted by name ascending.
 * Uses projection to load only the fields needed for list display.
 */
export async function getAllAuthors(
  authorFilter: AuthorFilter = {}
): Promise<AuthorType[]> {
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (authorFilter.isActive !== undefined) {
    filter.isActive = authorFilter.isActive;
  }

  const authors = await Author.find(filter)
    .sort({ name: 1 })
    .select("_id name slug bio photoUrl email twitterHandle websiteUrl isActive createdAt updatedAt")
    .lean();

  return authors.map(toLeanAuthor);
}

/**
 * List authors with search, filter, and pagination.
 *
 * Returns a paginated slice of authors matching the search criteria,
 * sorted by name ascending. Includes pagination metadata.
 */
export async function listAuthors(query: AuthorListQuery = {}): Promise<AuthorListResult> {
  const { page, limit, search = "", isActive } = query;
  const { page: safePage, limit: safeLimit } = sanitizePagination(page, limit);

  await connectDB();

  // Build query filter.
  const filter: Record<string, unknown> = {};
  if (isActive !== undefined) {
    filter.isActive = isActive;
  }

  // Add search filter (case-insensitive substring match across name, email, bio).
  if (search && search.trim().length > 0) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [
      { name: regex },
      { email: regex },
      { bio: regex },
      { twitterHandle: regex },
    ];
  }

  // Fetch paginated results with .lean() for performance.
  const [authors, total] = await Promise.all([
    Author.find(filter)
      .sort({ name: 1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .select("_id name slug bio photoUrl email twitterHandle websiteUrl isActive createdAt updatedAt")
      .lean(),
    Author.countDocuments(filter),
  ]);

  return {
    authors: authors.map(toLeanAuthor),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit),
    },
  };
}

/**
 * Toggle the isActive status of an author.
 *
 * Returns the updated document, or throws if not found.
 */
export async function toggleAuthorStatus(id: string): Promise<AuthorType> {
  await connectDB();

  const existing = await getAuthorOrThrow(id);

  const updated = await Author.findByIdAndUpdate(
    id,
    { isActive: !existing.isActive },
    { new: true }
  ).lean();

  if (!updated) {
    throw new NotFoundError(`Author with id ${id} not found`);
  }

  return toLeanAuthor(updated);
}

/**
 * Check whether an author with the given name, email, or slug already exists.
 *
 * When multiple fields are supplied, uses $or to check any condition.
 * Returns true if at least one match is found.
 */
export async function authorExists(
  name?: string,
  email?: string,
  slug?: string
): Promise<boolean> {
  await connectDB();

  const conditions: Record<string, unknown>[] = [];

  if (name) {
    conditions.push({
      name: { $regex: new RegExp(`^${escapeRegExp(name.trim())}$`, "i") },
    });
  }

  if (email) {
    conditions.push({
      email: { $regex: new RegExp(`^${escapeRegExp(email.trim())}$`, "i") },
    });
  }

  if (slug) {
    conditions.push({ slug: slug.trim() });
  }

  if (conditions.length === 0) {
    return false;
  }

  const exists = await Author.exists({ $or: conditions });
  return !!exists;
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Generate a unique slug by appending a numeric suffix if necessary.
 *
 * e.g. "john-doe" → "john-doe" → "john-doe-1" → "john-doe-2" …
 */
export async function generateUniqueSlug(baseSlug: string): Promise<string> {
  if (!baseSlug) {
    throw new ValidationError("Slug cannot be empty");
  }

  await connectDB();

  let candidate = baseSlug;
  let suffix = 1;

  // Check for existing author with the same slug (any status).
  while (await Author.exists({ slug: candidate })) {
    candidate = `${baseSlug}-${suffix}`;
    suffix++;
  }

  return candidate;
}
