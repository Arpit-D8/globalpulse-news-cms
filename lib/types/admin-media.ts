/**
 * Admin-specific media types, constants, and helper functions.
 *
 * This module is presentation-agnostic — it exports only TypeScript types,
 * immutable constants, and pure utility functions. No React, no hooks, no
 * API calls, no UI logic.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single media asset as returned by the admin API.
 *
 * Mirrors the Mongoose Media document and includes additional admin-facing
 * fields (filename, originalName, mimeType, caption) that may be computed
 * or exposed by API transformers.
 */
export type AdminMedia = {
  /** Unique MongoDB identifier. */
  _id: string;

  /** Cloudinary (or equivalent) public identifier. */
  publicId?: string;

  /** File extension or MIME subtype (e.g. "jpg", "png", "mp4"). */
  format?: string;

  /** Human-readable filename derived from originalName or publicId. */
  filename: string;

  /** The original uploaded file name (before any sanitisation). */
  originalName: string;

  /** Full public URL to the hosted asset. */
  url: string;

  /** MIME type of the asset (e.g. "image/jpeg", "video/mp4"). */
  mimeType: string;

  /** File size in bytes. */
  size: number;

  /** Rendered width in pixels (optional — may be absent for non-image assets). */
  width?: number;

  /** Rendered height in pixels (optional — may be absent for non-image assets). */
  height?: number;

  /** Accessibility alt text (defaults to empty string in the schema). */
  alt?: string;

  /** Optional caption displayed alongside the asset in the admin UI. */
  caption?: string;

  /** Uploader identity. When undefined the schema falls back to "Admin". */
  uploadedBy?: {
    /** MongoDB identifier of the uploader. */
    _id: string;
    /** Human-readable name of the uploader. */
    name: string;
  };

  /** ISO-8601 creation timestamp from Mongoose timestamps. */
  createdAt: string;

  /** ISO-8601 last-update timestamp from Mongoose timestamps. */
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * MIME types accepted for image uploads in the admin media library.
 *
 * Includes common raster formats plus SVG (vector).
 */
export const MEDIA_ACCEPTED_IMAGE_TYPES: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
] as const;

/**
 * Maximum allowed upload size in bytes (10 MB).
 *
 * Enforced on both the client and server side before the request reaches
 * the cloud storage provider.
 */
export const MAX_MEDIA_UPLOAD_SIZE = 10 * 1024 * 1024; // 10 MB in bytes

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Format a byte count into a human-readable string with appropriate units.
 *
 * Conversion rules:
 * - Less than 1024 bytes → `"N B"` (no decimal)
 * - Less than 1024 KB     → `"X.X KB"` (one decimal)
 * - Less than 1024 MB     → `"X.X MB"` (one decimal)
 * - 1024 MB and above     → `"X.X GB"` (one decimal)
 *
 * @param bytes - The file size in bytes (expected to be non-negative).
 * @returns A human-readable string such as `"450 B"`, `"2.2 KB"`, `"5 MB"`.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Format image dimensions into a human-readable string.
 *
 * @param width  - The image width in pixels (optional).
 * @param height - The image height in pixels (optional).
 * @returns `"W × H"` when both values are present, otherwise `"—"`.
 */
export function formatDimensions(
  width?: number,
  height?: number
): string {
  if (width == null || height == null) {
    return "—";
  }

  return `${width} × ${height}`;
}
