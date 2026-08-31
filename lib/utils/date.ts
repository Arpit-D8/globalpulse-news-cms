/**
 * Shared date formatting utilities.
 *
 * Centralises date formatting used by admin pages and site components.
 */

// ---------------------------------------------------------------------------
// Admin formatting
// ---------------------------------------------------------------------------

/**
 * Format a date string for admin UIs.
 *
 * Uses the locale-aware toLocaleDateString() with graceful null handling.
 * Returns "—" when the input is falsy or parsing fails.
 */
export function formatAdminDate(dateString?: string): string {
  if (!dateString) return "—";

  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return "—";
  }
}

// ---------------------------------------------------------------------------
// Site formatting
// ---------------------------------------------------------------------------

/**
 * Format a date string for card/list views (short format).
 *
 * e.g. "Jan 15, 2025"
 *
 * Returns "—" when the input is falsy, empty, or produces an invalid date.
 */
export function formatSiteDateShort(value: string): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/**
 * Format a date string for detail views (full format).
 *
 * e.g. "Thursday, January 15, 2025"
 *
 * Returns "—" when the input is falsy, empty, or produces an invalid date.
 */
export function formatSiteDateFull(value: string): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "full",
  }).format(date);
}
