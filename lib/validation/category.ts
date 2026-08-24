import { z } from "zod";

// ---------------------------------------------------------------------------
// Category — Create
// ---------------------------------------------------------------------------

/**
 * Schema for creating a new category.
 *
 * Mirrors the constraints from lib/validations/category.ts and the Category
 * model (models/Category.ts).
 */
export const categoryCreateSchema = z
  .object({
    name: z
      .string()
      .min(2, "Category name must be at least 2 characters")
      .max(80, "Category name must be at most 80 characters"),
    slug: z.string().optional(),
    description: z
      .string()
      .max(500, "Description must be at most 500 characters")
      .optional()
      .default(""),
    color: z
      .string()
      .max(20, "Color value is too long")
      .optional()
      .default("#6b7280"),
    icon: z
      .string()
      .max(50, "Icon value is too long")
      .optional()
      .default(""),
    displayOrder: z
      .number()
      .int("Display order must be an integer")
      .min(0, "Display order must be a non-negative integer")
      .optional()
      .default(0),
    isActive: z.boolean().optional().default(true),
  })
  .strict();

/**
 * Infer the TypeScript type for category create input.
 */
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;

// ---------------------------------------------------------------------------
// Category — Update (partial)
// ---------------------------------------------------------------------------

/**
 * Schema for updating an existing category.
 *
 * Every field is optional so callers can perform partial updates.
 */
export const categoryUpdateSchema = z
  .object({
    name: z
      .string()
      .min(2, "Category name must be at least 2 characters")
      .max(80, "Category name must be at most 80 characters")
      .optional(),
    slug: z.string().optional(),
    description: z
      .string()
      .max(500, "Description must be at most 500 characters")
      .optional(),
    color: z
      .string()
      .max(20, "Color value is too long")
      .optional(),
    icon: z
      .string()
      .max(50, "Icon value is too long")
      .optional(),
    displayOrder: z
      .number()
      .int("Display order must be an integer")
      .min(0, "Display order must be a non-negative integer")
      .optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .partial();

/**
 * Infer the TypeScript type for category update input.
 */
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
