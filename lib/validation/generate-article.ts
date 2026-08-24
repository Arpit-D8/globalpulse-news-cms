import { z } from "zod";

// ---------------------------------------------------------------------------
// Generate Article
// ---------------------------------------------------------------------------

/**
 * Schema for the AI article generation endpoint.
 *
 * Validates the prompt field sent to /api/generate-article.
 */
export const generateArticleSchema = z
  .object({
    prompt: z
      .string()
      .min(10, "Prompt must be at least 10 characters")
      .max(2000, "Prompt must be at most 2000 characters"),
  })
  .strict();

/**
 * Infer the TypeScript type for generate article input.
 */
export type GenerateArticleInput = z.infer<typeof generateArticleSchema>;
