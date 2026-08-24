"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { TagTable } from "@/components/admin/tags/TagTable";
import { Pagination } from "@/components/admin/shared/Pagination";
import { SearchInput } from "@/components/admin/shared/SearchInput";
import { useAdminList } from "@/lib/hooks/useAdminList";
import type { AdminTag } from "@/lib/types/admin-tag";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TagsPage() {
  const router = useRouter();

  // -- Fetcher --
  const fetcher = useCallback(
    async (_url: string, searchValue: string, currentPage: number) => {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE),
      });
      if (searchValue.trim()) {
        params.set("search", searchValue.trim());
      }
      const res = await fetch(`/api/admin/tags?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch tags (status ${res.status})`);
      }
      return res.json();
    },
    []
  );

  // -- Hook --
  const {
    items: tags,
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
  } = useAdminList<AdminTag>(null, {
    fetcher,
    pageSize: PAGE_SIZE,
    debounceMs: SEARCH_DEBOUNCE_MS,
    itemKey: "tags",
  });

  // -- State --
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // -- Handlers --
  const handleEdit = useCallback(
    (tag: AdminTag) => {
      router.push(`/admin/tags/${tag._id}/edit`);
    },
    [router]
  );

  const handleDelete = useCallback(
    async (tag: AdminTag) => {
      const confirmed = window.confirm(`Delete "${tag.name}"?`);
      if (!confirmed) return;

      setDeletingId(tag._id);

      try {
        const res = await fetch(`/api/admin/tags/${tag._id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          throw new Error(`Failed to delete tag (status ${res.status})`);
        }

        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete tag");
      } finally {
        setDeletingId(null);
      }
    },
    [setDeletingId, setError, refresh]
  );

  const handleToggle = useCallback(
    async (tag: AdminTag) => {
      setTogglingId(tag._id);

      try {
        const res = await fetch(`/api/admin/tags/${tag._id}/toggle`, {
          method: "PATCH",
        });

        if (!res.ok) {
          throw new Error(`Failed to toggle tag (status ${res.status})`);
        }

        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to toggle tag");
      } finally {
        setTogglingId(null);
      }
    },
    [setTogglingId, setError, refresh]
  );

  // -- Loading state (only during initial load) --
  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-100">
        <div className="mx-auto max-w-7xl p-8">
          <div className="rounded-xl bg-white p-10 text-center text-lg font-semibold text-neutral-500">
            Loading tags...
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
              Tags
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/tags/new"
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
              Create Tag
            </Link>
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
            placeholder="Search tags by name or slug..."
            aria-label="Search tags"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Table */}
        <TagTable
          tags={tags}
          total={total}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggle={handleToggle}
          deletingId={deletingId ?? undefined}
          togglingId={togglingId ?? undefined}
        />

        {/* Pagination */}
        <Pagination
          page={page}
          pages={pages}
          total={total}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          entityName="tags"
        />
      </section>
    </main>
  );
}
