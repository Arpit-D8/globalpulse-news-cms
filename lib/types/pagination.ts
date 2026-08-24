/**
 * Shared pagination metadata type.
 *
 * Used by admin pages, service layers, and UI components that need to
 * describe paginated result sets.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Pagination metadata returned by paginated listing operations.
 */
export type PaginationInfo = {
  /** Current page number (1-based). */
  page: number;
  /** Number of items per page. */
  limit: number;
  /** Total number of items across all pages. */
  total: number;
  /** Total number of pages. */
  pages: number;
};
