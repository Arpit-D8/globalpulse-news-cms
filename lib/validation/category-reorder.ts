import { z } from "zod";

// ---------------------------------------------------------------------------
// Category — Reorder
// ---------------------------------------------------------------------------

/**
 * Schema for the category reorder endpoint (PATCH /api/admin/categories/reorder).
 *
 * Validates an array of { id, displayOrder } pairs.
 */
export const categoryReorderSchema = z
  .object({
    reorders: z
      .array(
        z.object({
          id: z.string().min(1, "Category ID is required"),
          displayOrder: z
            .number()
            .int("Display order must be an integer")
            .min(0, "Display order must be a non-negative integer"),
        })
      )
      .min(1, "At least one reorder entry is required"),
  })
  .strict();

/**
 * Infer the TypeScript type for category reorder input.
 */
export type CategoryReorderInput = z.infer<typeof categoryReorderSchema>;
