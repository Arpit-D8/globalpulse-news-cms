"use client";

import { useCallback, useState } from "react";
import { MediaGrid } from "@/components/admin/media/MediaGrid";
import { MediaUploadModal } from "@/components/admin/media/MediaUploadModal";
import { MediaEditAltModal } from "@/components/admin/media/MediaEditAltModal";
import { Pagination } from "@/components/admin/shared/Pagination";
import { SearchInput } from "@/components/admin/shared/SearchInput";
import { useAdminList } from "@/lib/hooks/useAdminList";
import { useToast } from "@/components/ui/Toast";
import type { AdminMedia } from "@/lib/types/admin-media";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 300;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminMediaPage() {
  // -- Fetcher --
  const fetcher = useCallback(
    async (_url: string, searchValue: string, currentPage: number) => {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE),
        search: searchValue,
        sort: "newest",
      });
      const res = await fetch(`/api/admin/media?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch media (status ${res.status})`);
      }
      return res.json();
    },
    []
  );

  // -- Hook --
  const {
    items: media,
    total,
    pages,
    page,
    search,
    setSearch,
    loading,
    error,
    deletingId,
    setDeletingId,
    setError,
    refresh,
    setPage,
  } = useAdminList<AdminMedia>(null, {
    fetcher,
    pageSize: PAGE_SIZE,
    debounceMs: SEARCH_DEBOUNCE_MS,
    itemKey: "media",
  });

  // -- Modal state --
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editMedia, setEditMedia] = useState<AdminMedia | null>(null);

  const showToast = useToast().showToast;

  // -- Handlers --
  const handleUploadOpen = useCallback(() => {
    setUploadOpen(true);
  }, []);

  const handleUploaded = useCallback(() => {
    showToast({ message: "Image uploaded successfully", type: "success" });
    refresh();
  }, [refresh, showToast]);

  const handleEditAlt = useCallback((mediaItem: AdminMedia) => {
    setEditMedia(mediaItem);
  }, []);

  const handleEditClose = useCallback(() => {
    setEditMedia(null);
  }, []);

  const handleEdited = useCallback(() => {
    showToast({ message: "Alt text updated successfully", type: "success" });
    refresh();
    setEditMedia(null);
  }, [refresh, showToast]);

  const handleDelete = useCallback(
    async (mediaItem: AdminMedia) => {
      const confirmed = window.confirm(
        `Delete "${mediaItem.filename}"? This action cannot be undone.`
      );

      if (!confirmed) {
        return;
      }

      // Optimistic UI: capture previous state inside the functional updater.
      let previousMedia: AdminMedia[] = [];
      // Note: setMedia is not exposed by the hook, so we use a direct fetch rollback approach.
      setDeletingId(mediaItem._id);

      try {
        const res = await fetch(`/api/admin/media/${mediaItem._id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error?.message || `Failed to delete media (status ${res.status})`);
        }

        showToast({ message: "Media deleted successfully", type: "success" });
        await refresh();
      } catch (err) {
        // Rollback: refetch to restore correct state
        await refresh();
        setError(
          err instanceof Error ? err.message : "Failed to delete media"
        );
        showToast({
          message: err instanceof Error ? err.message : "Failed to delete media",
          type: "error",
        });
      } finally {
        setDeletingId(null);
      }
    },
    [refresh, setError, showToast]
  );

  // -- Loading state (only during initial load) --
  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-100">
        <div className="mx-auto max-w-7xl p-8">
          <div className="rounded-xl bg-white p-10 text-center text-lg font-semibold text-neutral-500">
            Loading media...
          </div>
        </div>
      </main>
    );
  }

  // -- Render --
  return (
    <main className="min-h-screen bg-neutral-100">
      {/* Header */}
      <section className="border-b border-neutral-200 bg-neutral-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">
              VIDARBHA PRINT CMS
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-normal">
              Media Library
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleUploadOpen}
              className="inline-flex items-center gap-2 bg-red-700 px-4 py-2 text-sm font-black uppercase text-white transition hover:bg-red-800"
            >
              <svg
                className="size-4"
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
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Upload Image
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Search */}
        <div className="mb-6">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search media by filename or original name..."
            aria-label="Search media"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Grid */}
        <MediaGrid
          media={media}
          onEdit={handleEditAlt}
          onDelete={handleDelete}
          deletingId={deletingId ?? undefined}
        />

        {/* Pagination */}
        <Pagination
          page={page}
          pages={pages}
          total={total}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          entityName="media items"
        />
      </section>

      {/* Upload Modal */}
      <MediaUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={handleUploaded}
      />

      {/* Edit Alt Text Modal */}
      {editMedia && (
        <MediaEditAltModal
          open={!!editMedia}
          onClose={handleEditClose}
          media={editMedia}
          onUpdated={handleEdited}
        />
      )}
    </main>
  );
}
