import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Media from "@/models/Media";
import type { MediaDocument } from "@/models/Media";
import { cloudinary } from "@/lib/cloudinary";
import type { UploadApiResponse } from "cloudinary";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { PaginationInfo } from "@/lib/types/pagination";
import { sanitizePagination } from "@/lib/utils/pagination";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ImageUploadOptions = {
  alt?: string;
  createdBy?: string;
};

export type MediaListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: "newest" | "oldest";
};

export type MediaListResult = {
  media: MediaDocument[];
  pagination: PaginationInfo;
};

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Build a case-insensitive regex filter across all searchable fields.
 *
 * Searchable fields: publicId, alt, createdBy, format.
 * Returns undefined when search is empty so the query stays clean.
 */
function buildSearchFilter(search: string): Record<string, unknown> | undefined {
  if (!search || search.trim().length === 0) return undefined;

  const regex = new RegExp(search.trim(), "i");

  return {
    $or: [
      { publicId: regex },
      { alt: regex },
      { createdBy: regex },
      { format: regex },
    ],
  };
}

/**
 * Validate and extract metadata from a Cloudinary upload response.
 *
 * Throws ValidationError when Cloudinary fails to return required fields
 * (width, height, format, or bytes), preventing corrupt documents from
 * being persisted.
 */
function extractMediaMetadata(response: UploadApiResponse): {
  width: number;
  height: number;
  format: string;
  bytes: number;
} {
  const width = response.width;
  const height = response.height;
  const format = response.format;
  const bytes = response.bytes;

  const missing: string[] = [];

  if (width == null || width <= 0) missing.push("width");
  if (height == null || height <= 0) missing.push("height");
  if (!format || format.length === 0) missing.push("format");
  if (bytes == null || bytes <= 0) missing.push("bytes");

  if (missing.length > 0) {
    throw new ValidationError("Incomplete Cloudinary metadata", {
      details: Object.fromEntries(
        missing.map((field) => [field, "Missing or invalid metadata from Cloudinary"])
      ),
    });
  }

  return { width, height, format, bytes };
}

/**
 * Validate that required Cloudinary environment variables are present.
 *
 * Throws ValidationError when any variable is missing.
 */
function validateCloudinaryConfig(): void {
  const missing: string[] = [];

  if (!process.env.CLOUDINARY_CLOUD_NAME) missing.push("CLOUDINARY_CLOUD_NAME");
  if (!process.env.CLOUDINARY_API_KEY) missing.push("CLOUDINARY_API_KEY");
  if (!process.env.CLOUDINARY_API_SECRET) missing.push("CLOUDINARY_API_SECRET");

  if (missing.length > 0) {
    throw new ValidationError("Cloudinary configuration error", {
      details: Object.fromEntries(
        missing.map((v) => [v, "Missing required environment variable"])
      ),
    });
  }
}

/**
 * Validate that a string is a valid MongoDB ObjectId.
 *
 * Throws ValidationError when the id is not a valid ObjectId format.
 */
function validateObjectId(id: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError("Invalid media id");
  }
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

/**
 * Upload an image to Cloudinary and persist metadata in MongoDB.
 *
 * Accepts a base64-encoded data URL or direct URL, uploads to Cloudinary,
 * extracts dimensions/format/size from the response, and stores the result
 * in the Media collection. Returns the created Media document.
 *
 * If the input is already a Cloudinary URL, the Cloudinary upload step is
 * skipped and the Media document is created directly from the provided URL.
 */
export async function uploadImage(
  file: string,
  options: ImageUploadOptions = {}
): Promise<MediaDocument> {
  const { alt = "", createdBy = "Admin" } = options;

  // Validate input.
  if (!file || typeof file !== "string" || file.trim().length === 0) {
    throw new ValidationError("Upload file parameter must be a non-empty string");
  }

  validateCloudinaryConfig();
  await connectDB();

  let width: number;
  let height: number;
  let format: string;
  let bytes: number;
  let publicId: string;
  let secureUrl: string;

  // Check if the input is already a Cloudinary URL.
  const isCloudinaryUrl = /^https?:\/\/res\.cloudinary\.com\//.test(file);

  if (isCloudinaryUrl) {
    // Already on Cloudinary — extract metadata from the URL.
    secureUrl = file.trim();
    bytes = 0;

    // Extract public_id from URL: https://res.cloudinary.com/:cloud_name/:type/:image/:public_id[.:format]
    const urlParts = new URL(secureUrl).pathname.split("/").filter(Boolean);
    // Find the index of "image" in the path
    const imageIndex = urlParts.findIndex((part) => part === "image");
    if (imageIndex === -1 || imageIndex >= urlParts.length - 1) {
      throw new ValidationError("Invalid Cloudinary URL: could not extract public_id");
    }

    // public_id is the next segment after "image"
    let rawPublicId = urlParts[imageIndex + 1];

    // Extract format from URL if present (e.g., "image.png")
    const formatMatch = rawPublicId.match(/^(.*)\.([a-z0-9]+)$/i);
    if (formatMatch) {
      format = formatMatch[2].toLowerCase();
      rawPublicId = formatMatch[1];
    } else {
      // Default to jpg if no extension
      format = "jpg";
    }

    publicId = rawPublicId.toLowerCase();

    // Use a default bytes value since we can't get it from URL alone.
    // In production, you might want to fetch the image head to get exact bytes.
    bytes = 0;

    // Use placeholder dimensions — these will be inaccurate for queries
    // that filter by size, but most workflows don't depend on this.
    width = 0;
    height = 0;
  } else {
    // Upload using native Promise API (no callback wrapper).
    let response: UploadApiResponse;

    try {
      response = await cloudinary.uploader.upload(file, {
        folder: "globalpulse-news",
        resource_type: "auto",
      });
    } catch (error: unknown) {
      if (error instanceof ValidationError) throw error;
      throw new ValidationError("Cloudinary upload failed", {
        details: { message: error instanceof Error ? error.message : "Unknown upload error" },
      });
    }

    const metadata = extractMediaMetadata(response);

    width = metadata.width;
    height = metadata.height;
    format = metadata.format;
    bytes = metadata.bytes;
    publicId = response.public_id;
    secureUrl = response.secure_url;
  }

  const doc = await Media.create({
    publicId,
    url: secureUrl,
    width,
    height,
    format,
    bytes: isCloudinaryUrl ? 0 : bytes,
    alt,
    createdBy,
  });

  return doc;
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

/**
 * List images with search, sort, and pagination.
 *
 * Returns a paginated slice of Media documents matching the search criteria,
 * sorted by creation date (newest or oldest). Includes pagination metadata.
 * Uses projection to load only the fields needed for list display.
 */
export async function listImages(query: MediaListQuery = {}): Promise<MediaListResult> {
  const { page, limit, search = "", sort = "newest" } = query;
  const { page: safePage, limit: safeLimit } = sanitizePagination(page, limit);

  await connectDB();

  // Build query filter.
  const filter: Record<string, unknown> = buildSearchFilter(search) ?? {};

  // Build sort order.
  const sortOrder = sort === "oldest" ? 1 : -1;

  // Fetch paginated results with .lean() and projection for performance.
  const [media, total] = await Promise.all([
    Media.find(filter)
      .sort({ createdAt: sortOrder })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .select("_id publicId url alt createdBy width height format bytes createdAt updatedAt")
      .lean(),
    Media.countDocuments(filter),
  ]);

  return {
    media,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit),
    },
  };
}

// ---------------------------------------------------------------------------
// Retrieve
// ---------------------------------------------------------------------------

/**
 * Retrieve a single image by its _id.
 *
 * Throws NotFoundError when the image does not exist.
 * Uses lean + projection for improved performance.
 */
export async function getImage(id: string): Promise<MediaDocument> {
  await connectDB();

  validateObjectId(id);

  const doc = await Media.findById(id)
    .select("_id publicId url alt createdBy width height format bytes createdAt updatedAt")
    .lean();

  if (!doc) {
    throw new NotFoundError(`Media with id ${id} not found`);
  }

  return doc;
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

/**
 * Update the alt text for an existing media document.
 *
 * Throws NotFoundError when the media does not exist.
 * Returns the updated lean document with projection.
 */
export async function updateImageAlt(id: string, alt: string): Promise<MediaDocument> {
  await connectDB();

  validateObjectId(id);

  if (!alt || alt.trim().length === 0) {
    throw new ValidationError("Alt text cannot be empty");
  }

  const doc = await Media.findByIdAndUpdate(
    id,
    { alt: alt.trim() },
    { new: true }
  )
    .select("_id publicId url alt createdBy width height format bytes createdAt updatedAt")
    .lean();

  if (!doc) {
    throw new NotFoundError(`Media with id ${id} not found`);
  }

  return doc;
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/**
 * Delete a media document from MongoDB and remove the asset from Cloudinary.
 *
 * Safer deletion flow: findById() → check → Cloudinary delete (best effort) →
 * deleteOne() to avoid deleting the wrong document in edge cases.
 */
export async function deleteImage(id: string): Promise<{ success: boolean }> {
  await connectDB();

  validateObjectId(id);

  // First, find the document to get the publicId.
  const doc = await Media.findById(id);

  if (!doc) {
    throw new NotFoundError(`Media with id ${id} not found`);
  }

  // Delete from Cloudinary (best-effort).
  try {
    await cloudinary.uploader.destroy(doc.publicId);
  } catch (error: unknown) {
    console.error("[deleteImage] Cloudinary deletion failed:", error);
  }

  // Now delete from MongoDB.
  await Media.findByIdAndDelete(id);

  return { success: true };
}
