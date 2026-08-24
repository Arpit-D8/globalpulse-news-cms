import { z } from "zod";

// ---------------------------------------------------------------------------
// Author — Create
// ---------------------------------------------------------------------------

/**
 * Schema for creating a new author.
 *
 * Mirrors the constraints from lib/validations/author.ts and the Author
 * model (models/Author.ts).
 */
export const authorCreateSchema = z
  .object({
    name: z
      .string()
      .min(2, "Author name must be at least 2 characters")
      .max(120, "Author name must be at most 120 characters"),
    slug: z.string().optional(),
    bio: z
      .string()
      .max(2000, "Bio must be at most 2000 characters")
      .optional()
      .default(""),
    photoUrl: z
      .string()
      .url("Photo URL must be a valid URL")
      .or(z.literal(""))
      .optional(),
    email: z
      .string()
      .email("Email must be a valid email address")
      .max(254, "Email must be at most 254 characters")
      .optional(),
    twitterHandle: z
      .string()
      .max(20, "Twitter handle must be at most 20 characters")
      .or(z.literal(""))
      .optional(),
    websiteUrl: z
      .string()
      .url("Website URL must be a valid URL")
      .or(z.literal(""))
      .optional(),
    isActive: z.boolean().optional().default(true),
  })
  .strict();

/**
 * Infer the TypeScript type for author create input.
 */
export type AuthorCreateInput = z.infer<typeof authorCreateSchema>;

// ---------------------------------------------------------------------------
// Author — Update (partial)
// ---------------------------------------------------------------------------

/**
 * Schema for updating an existing author.
 *
 * Every field is optional so callers can perform partial updates.
 */
export const authorUpdateSchema = z
  .object({
    name: z
      .string()
      .min(2, "Author name must be at least 2 characters")
      .max(120, "Author name must be at most 120 characters")
      .optional(),
    slug: z.string().optional(),
    bio: z
      .string()
      .max(2000, "Bio must be at most 2000 characters")
      .optional(),
    photoUrl: z
      .string()
      .url("Photo URL must be a valid URL")
      .or(z.literal(""))
      .optional(),
    email: z
      .string()
      .email("Email must be a valid email address")
      .max(254, "Email must be at most 254 characters")
      .optional(),
    twitterHandle: z
      .string()
      .max(20, "Twitter handle must be at most 20 characters")
      .or(z.literal(""))
      .optional(),
    websiteUrl: z
      .string()
      .url("Website URL must be a valid URL")
      .or(z.literal(""))
      .optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .partial();

/**
 * Infer the TypeScript type for author update input.
 */
export type AuthorUpdateInput = z.infer<typeof authorUpdateSchema>;
