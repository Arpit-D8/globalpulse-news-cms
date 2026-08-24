"use client";

import { useState, useEffect, useCallback, useRef } from "react";

import MediaSearch from "@/components/admin/media/MediaSearch";
import { MediaGrid } from "@/components/admin/media/MediaGrid";
import type { AdminMedia } from "@/lib/types/admin-media";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PaginationInfo = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

type MediaApiResponse = {
  success: boolean;
  data: {
    media: AdminMedia[];
    pagination: PaginationInfo;
  };
};

/**
 * Props for the media picker modal.
 *
 * A reusable modal that allows users to browse, search, and select
 * an existing image from the media library. Supports pagination.
 */
export type MediaPickerModalProps = {
  /** Whether the modal is currently open. */
  open: boolean;
  /** Called when the user closes the modal without a selection. */
  onClose: () => void;
  /** Called when the user selects a media item. Modal closes automatically. */
  onSelect: (media: AdminMedia) => void;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 12;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Modal component for picking an existing media asset.
 *
 * Reuses the same API, MediaSearch, and MediaGrid components as the
 * admin media library page.
 *
 * Features:
 * - Searchable, paginated grid of media assets
 * - Single image selection with visual highlighting
 * - Loading, error, and empty states
 * - All business logic contained within this component
 *
 * Does NOT:
 * - Duplicate MediaCard (extends MediaCard/MediaGrid with selection props)
 * - Expose delete, edit, or upload actions
 * - Create new API calls or hooks
 */
export function MediaPickerModal({
  open,
  onClose,
  onSelect,
}: MediaPickerModalProps) {
  const [media, setMedia] = useState<AdminMedia[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pages: 0,
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Fetch media from the admin API.
   */
  const fetchMedia = useCallback(async (searchValue: string, currentPage: number) => {
    // Cancel any previous in-flight request.
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE),
        search: searchValue,
        sort: "newest",
      });

      const response = await fetch(`/api/admin/media?${params}`, {
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch media");
      }

      const data: MediaApiResponse = await response.json();

      if (!data.success) {
        throw new Error("Failed to fetch media");
      }

      setMedia(data.data.media);
      setPagination(data.data.pagination);
      // Clear selection when data changes.
      setSelectedId(null);
    } catch (err) {
      // Ignore aborted requests.
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }

      console.error("[Media Picker Error]", err);
      setError(err instanceof Error ? err.message : "Failed to load media");
      setMedia([]);
    } finally {
      // Only update state if this request is still the latest.
      if (abortControllerRef.current === abortController) {
        setLoading(false);
      }
    }
  }, []);

  /**
   * Reset modal state when it opens.
   */
  useEffect(() => {
    if (open) {
      setSearch("");
      setPage(1);
    }
  }, [open]);

  /**
   * Fetch media when search or page changes.
   */
  useEffect(() => {
    if (!open) return;
    fetchMedia(search, page);
  }, [open, search, page, fetchMedia]);

  /**
   * Cleanup abort controller on unmount.
   */
  useEffect(() => {
    if (!open) return;
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [open]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handlePreviousPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const handleNextPage = useCallback(() => {
    if (page < pagination.pages) {
      setPage(page + 1);
    }
  }, [page, pagination.pages]);

  /**
   * Handle media selection.
   */
  const handleSelect = useCallback((selectedMedia: AdminMedia) => {
    setSelectedId(selectedMedia._id);
    // Close modal and notify parent after a brief delay for visual feedback.
    setTimeout(() => {
      onSelect(selectedMedia);
    }, 200);
  }, [onSelect]);

  /**
   * Handle backdrop click to close.
   */
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  /**
   * Handle Escape key to close.
   */
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Don't render anything when the modal is closed.
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        aria-hidden="true"
      >
        {/* Modal */}
        <div className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex flex-col gap-4 border-b border-neutral-200 bg-neutral-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-neutral-800">Select an Image</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-300 bg-white p-2 text-neutral-600 transition hover:bg-neutral-100"
              aria-label="Close modal"
            >
              <svg
                className="size-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="border-b border-neutral-200 bg-white px-6 py-4">
            <MediaSearch value={search} onChange={handleSearchChange} />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-neutral-500">Loading media...</p>
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                <p className="text-sm font-medium text-red-700">{error}</p>
                <button
                  type="button"
                  onClick={() => fetchMedia(search, page)}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                >
                  <svg
                    className="size-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                    />
                  </svg>
                  Retry
                </button>
              </div>
            ) : media.length === 0 ? (
              <MediaGrid media={[]} onSelect={handleSelect} selectedIds={selectedId ? [selectedId] : undefined} />
            ) : (
              <>
                <MediaGrid media={media} onSelect={handleSelect} selectedIds={selectedId ? [selectedId] : undefined} />

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={handlePreviousPage}
                      disabled={page <= 1}
                      className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-neutral-600">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextPage}
                      disabled={page >= pagination.pages}
                      className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
