"use client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PaginationProps = {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  entityName: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Presentational pagination component for admin list pages.
 *
 * Renders:
 * - "Showing X–Y of Z {entityName}" text
 * - "Page N of M" indicator
 * - Previous / Next buttons with disabled states
 *
 * Returns null when there is only one page (no pagination needed).
 */
export function Pagination({
  page,
  pages,
  total,
  pageSize,
  onPageChange,
  entityName,
}: PaginationProps) {
  const displayPages = pages || 1;
  const canGoPrevious = page > 1;
  const canGoNext = page < displayPages;

  if (displayPages <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-6 py-4 shadow-sm">
      <p className="text-sm font-semibold text-neutral-600">
        Showing{" "}
        {total === 0
          ? 0
          : (page - 1) * pageSize + 1}
        –{Math.min(page * pageSize, total)} of {total} {entityName}
      </p>
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold text-neutral-600">
          Page {page} of {displayPages}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={!canGoPrevious}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-4 py-2 text-sm font-black uppercase text-neutral-700 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-neutral-300 disabled:hover:bg-transparent disabled:hover:text-neutral-700"
            aria-label="Previous page"
          >
            <svg
              className="size-3.5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
            Previous
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={!canGoNext}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-4 py-2 text-sm font-black uppercase text-neutral-700 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-neutral-300 disabled:hover:bg-transparent disabled:hover:text-neutral-700"
            aria-label="Next page"
          >
            Next
            <svg
              className="size-3.5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
