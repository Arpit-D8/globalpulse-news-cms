import { z } from "zod";

// ---------------------------------------------------------------------------
// Media — Upload metadata
// ---------------------------------------------------------------------------

/**
 * Schema for media upload metadata (POST /api/admin/media).
 *
 * Validates the file, alt text, and createdBy fields from the request body.
 * The file field accepts a base64-encoded data URL or direct URL.
 */
export const mediaUploadSchema = z
  .object({
    file: z
      .string()
      .min(1, "File is required"),
    alt: z
      .string()
      .max(500, "Alt text must be at most 500 characters")
      .optional()
      .default(""),
    createdBy: z
      .string()
      .max(120, "Creator must be at most 120 characters")
      .optional()
      .default(""),
  })
  .strict();

/**
 * Infer the TypeScript type for media upload input.
 */
export type MediaUploadInput = z.infer<typeof mediaUploadSchema>;

// ---------------------------------------------------------------------------
// Media — Update alt text (PATCH /api/admin/media/:id)
// ---------------------------------------------------------------------------

/**
 * Schema for updating media metadata.
 *
 * Only the alt field is expected in the PATCH body.
 */
export const mediaUpdateSchema = z
  .object({
    alt: z
      .string()
      .max(500, "Alt text must be at most 500 characters")
      .optional(),
  })
  .strict()
  .partial();

/**
 * Infer the TypeScript type for media update input.
 */
export type MediaUpdateInput = z.infer<typeof mediaUpdateSchema>;
