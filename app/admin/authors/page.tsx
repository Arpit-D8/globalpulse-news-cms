"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { AuthorTable } from "@/components/admin/authors/AuthorTable";
import { Pagination } from "@/components/admin/shared/Pagination";
import { SearchInput } from "@/components/admin/shared/SearchInput";
import { useAdminList } from "@/lib/hooks/useAdminList";
import type { AdminAuthor } from "@/lib/types/admin-author";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AuthorsPage() {
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
      const res = await fetch(`/api/admin/authors?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch authors (status ${res.status})`);
      }
      return res.json();
    },
    []
  );

  // -- Hook --
  const {
    items: authors,
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
  } = useAdminList<AdminAuthor>(null, {
    fetcher,
    pageSize: PAGE_SIZE,
    debounceMs: SEARCH_DEBOUNCE_MS,
    itemKey: "authors",
  });

  // -- Handlers --
  const handleEdit = useCallback(
    (author: AdminAuthor) => {
      router.push(`/admin/authors/${author._id}/edit`);
    },
    [router]
  );

  const handleDelete = useCallback(
    async (author: AdminAuthor) => {
      const confirmed = window.confirm(`Delete "${author.name}"?`);
      if (!confirmed) return;

      setDeletingId(author._id);

      try {
        const res = await fetch(`/api/admin/authors/${author._id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          throw new Error(`Failed to delete author (status ${res.status})`);
        }

        await refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete author"
        );
      } finally {
        setDeletingId(null);
      }
    },
    [setDeletingId, setError, refresh]
  );

  // -- Loading state (only during initial load) --
  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-100">
        <div className="mx-auto max-w-7xl p-8">
          <div className="rounded-xl bg-white p-10 text-center text-lg font-semibold text-neutral-500">
            Loading authors...
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
              Authors
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/authors/new"
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
              New Author
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
            placeholder="Search authors by name, email, bio, or Twitter…"
            aria-label="Search authors"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Table */}
        <AuthorTable
          authors={authors}
          total={total}
          onEdit={handleEdit}
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
          entityName="authors"
        />
      </section>
    </main>
  );
}
