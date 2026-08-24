import { z } from "zod";

// ---------------------------------------------------------------------------
// Tag — Create
// ---------------------------------------------------------------------------

/**
 * Schema for creating a new tag.
 *
 * Mirrors the constraints from lib/validations/tag.ts and the Tag model
 * (models/Tag.ts).
 */
export const tagCreateSchema = z
  .object({
    name: z
      .string()
      .min(2, "Tag name must be at least 2 characters")
      .max(80, "Tag name must be at most 80 characters"),
    slug: z.string().optional(),
    description: z
      .string()
      .max(500, "Description must be at most 500 characters")
      .optional()
      .default(""),
    isActive: z.boolean().optional().default(true),
  })
  .strict();

/**
 * Infer the TypeScript type for tag create input.
 */
export type TagCreateInput = z.infer<typeof tagCreateSchema>;

// ---------------------------------------------------------------------------
// Tag — Update (partial)
// ---------------------------------------------------------------------------

/**
 * Schema for updating an existing tag.
 *
 * Every field is optional so callers can perform partial updates.
 */
export const tagUpdateSchema = z
  .object({
    name: z
      .string()
      .min(2, "Tag name must be at least 2 characters")
      .max(80, "Tag name must be at most 80 characters")
      .optional(),
    slug: z.string().optional(),
    description: z
      .string()
      .max(500, "Description must be at most 500 characters")
      .optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .partial();

/**
 * Infer the TypeScript type for tag update input.
 */
export type TagUpdateInput = z.infer<typeof tagUpdateSchema>;
