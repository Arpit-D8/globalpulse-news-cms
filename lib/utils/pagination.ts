/**
 * Shared pagination utility functions.
 *
 * Centralises common pagination logic used by service layers.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Sanitized pagination parameters.
 */
export type SanitizedPagination = {
  page: number;
  limit: number;
};

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Sanitize pagination parameters.
 *
 * - page defaults to 1, clamped to >= 1
 * - limit defaults to 10, clamped to [1, 100]
 */
export function sanitizePagination(page?: number, limit?: number): SanitizedPagination {
  const p = Math.max(1, Math.floor(page ?? 1));
  const l = Math.min(100, Math.max(1, Math.floor(limit ?? 10)));

  return { page: p, limit: l };
}
