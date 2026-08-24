/**
 * Generate a URL-safe slug from a human-readable string.
 *
 * Rules:
 * - Lowercase
 * - Replace spaces and invalid characters with hyphens
 * - Collapse multiple hyphens into one
 * - Strip leading/trailing hyphens
 */
export function generateSlug(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "")
  );
}
