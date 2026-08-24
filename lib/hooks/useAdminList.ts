"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Pagination metadata returned by admin list API endpoints.
 */
export type PaginationInfo = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

/**
 * Shape of a paginated admin list API response.
 *
 * T is the item type (AdminArticle, AdminAuthor, AdminTag, AdminCategory, AdminMedia).
 * The `items` key is configurable via the `itemKey` option in UseAdminListOptions.
 */
export type AdminListResponse<T, K extends string = "items"> = {
  success: boolean;
  data: {
    [key in K]: T[];
  } & {
    pagination: PaginationInfo;
  };
};

/**
 * Options for the useAdminList hook.
 */
export interface UseAdminListOptions<T> {
  /**
   * Async function that fetches a page of items.
   * Receives the URL path (e.g. "/api/admin/articles"), search string, and page number.
   * Returns the parsed JSON response (already deserialized).
   */
  fetcher: (url: string, search: string, page: number) => Promise<AdminListResponse<T>>;
  /** Number of items per page. Default: 10. */
  pageSize?: number;
  /** Search debounce delay in milliseconds. Default: 300. */
  debounceMs?: number;
  /**
   * Key used to access items in the response data object.
   * Default: "items". Use "media" for the media library API.
   */
  itemKey?: string;
}

/**
 * Return value of the useAdminList hook.
 */
export interface UseAdminListReturn<T> {
  /** Current list of items. */
  items: T[];
  /** Total item count across all pages. */
  total: number;
  /** Total number of pages. */
  pages: number;
  /** Current page number (1-based). */
  page: number;
  /** Raw search input value (for binding to <input>). */
  search: string;
  /** Setter for the raw search input value. */
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  /** Whether data is currently loading. */
  loading: boolean;
  /** Error message, or null if no error. */
  error: string | null;
  /** ID of the item currently being deleted (for optimistic UI), or null. */
  deletingId: string | null;
  /** Set the deletingId for optimistic delete UI. */
  setDeletingId: React.Dispatch<React.SetStateAction<string | null>>;
  /** Set the error message. */
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  /** Re-fetch the current page with the current search value. */
  refresh: () => void;
  /** Navigate to a specific page. */
  setPage: React.Dispatch<React.SetStateAction<number>>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Generic hook for admin list pages.
 *
 * Encapsulates shared list-management logic:
 * - Debounced search with configurable delay
 * - Pagination state management
 * - Loading and error states
 * - Request cancellation via AbortController (stale request suppression)
 * - Initial-load-only loading indicator
 * - Refresh capability
 *
 * @example
 * ```ts
 * const {
 *   items, loading, error, search, setSearch,
 *   page, setPage, pagination, refresh, setDeletingId
 * } = useAdminList(AdminArticle, {
 *   fetcher: fetchAdminList<AdminArticle>,
 *   pageSize: 10,
 *   debounceMs: 300,
 * });
 * ```
 */
export function useAdminList<T>(
  _ItemType: React.ComponentType | null,
  options: UseAdminListOptions<T>
): UseAdminListReturn<T> {
  const {
    fetcher,
    debounceMs = 300,
    itemKey = "items",
  } = options;

  // -- State --
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // -- Refs --
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoadRef = useRef(true);

  // -- Effect: fetch on debounced search or page changes --
  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Abort any in-flight request (stale request suppression)
      abortControllerRef.current?.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Only show loading on initial load
      if (isInitialLoadRef.current) {
        setLoading(true);
      }

      setError(null);

      try {
        const data = await fetcher("", debouncedSearch, page);

        if (!data.success) {
          throw new Error("Failed to fetch data");
        }

        if (!cancelled) {
          const itemData = ((data.data as Record<string, unknown>)[itemKey] as T[]) ?? [];
          setItems(itemData);
          setTotal(data.data.pagination?.total ?? 0);
          setPages(data.data.pagination?.pages ?? 1);
          setPage(page);
        }
      } catch (err) {
        // Ignore aborted requests
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "An unexpected error occurred"
          );
          setItems([]);
        }
      } finally {
        // Only hide loading on initial load
        if (!cancelled && isInitialLoadRef.current) {
          setLoading(false);
          isInitialLoadRef.current = false;
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [fetcher, itemKey, debouncedSearch, page, refreshKey]);

  // -- Effect: cleanup on unmount --
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  const refresh = useCallback(() => {
    // Trigger a re-fetch by temporarily toggling a counter.
    setRefreshKey((k) => k + 1);
  }, []);

  // -- Return --
  return {
    items,
    total,
    pages,
    page,
    search,
    setSearch: (value: string | ((prev: string) => string)) => {
      // If called with a string, update directly and debounce
      if (typeof value === "string") {
        setSearch(value);
        if (searchTimerRef.current) {
          clearTimeout(searchTimerRef.current);
        }
        searchTimerRef.current = setTimeout(() => {
          setDebouncedSearch(value);
        }, debounceMs);
      } else {
        // If called with a function, just update state (no debounce)
        setSearch(value);
      }
    },
    loading,
    error,
    deletingId,
    setDeletingId,
    setError,
    refresh,
    setPage,
  };
}
