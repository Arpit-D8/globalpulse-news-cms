"use client";

import { useState } from "react";
import Link from "next/link";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArticleTable } from "@/components/admin/article/ArticleTable";
import { Pagination } from "@/components/admin/shared/Pagination";
import { SearchInput } from "@/components/admin/shared/SearchInput";
import { useAdminList } from "@/lib/hooks/useAdminList";
import type { AdminArticle } from "@/lib/types/admin-article";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

/** Valid status filter values for the dropdown. */
const STATUS_OPTIONS: { value: "" | "draft" | "published" | "archived"; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ArticlesPage() {
  const router = useRouter();

  // -- Status filter state --
  const [statusFilter, setStatusFilter] = useState<string>("");

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
      if (statusFilter) {
        params.set("status", statusFilter);
      }
      const res = await fetch(`/api/admin/articles?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch articles (status ${res.status})`);
      }
      return res.json();
    },
    [statusFilter]
  );

  // -- Hook --
  const {
    items: articles,
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
  } = useAdminList<AdminArticle>(null, {
    fetcher,
    pageSize: PAGE_SIZE,
    debounceMs: SEARCH_DEBOUNCE_MS,
    itemKey: "articles",
  });

  // -- Status update state --
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // -- Status change handler --
  const handleStatusChange = useCallback(
    async (article: AdminArticle, newStatus: "draft" | "published" | "archived") => {
      const label = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      const confirmed = window.confirm(`Change "${article.title}" to ${label}?`);
      if (!confirmed) return;

      setUpdatingId(article._id);

      try {
        const res = await fetch(`/api/admin/articles/${article._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message ?? `Failed to update status (status ${res.status})`);
        }

        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update article status");
      } finally {
        setUpdatingId(null);
      }
    },
    [refresh, setError]
  );

  // -- Handlers --
  const handleEdit = useCallback(
    (article: AdminArticle) => {
      router.push(`/admin/articles/${article._id}/edit`);
    },
    [router]
  );

  const handleDelete = useCallback(
    async (article: AdminArticle) => {
      const confirmed = window.confirm(`Delete "${article.title}"?`);
      if (!confirmed) return;

      setDeletingId(article._id);

      try {
        const res = await fetch(`/api/admin/articles/${article._id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          throw new Error(`Failed to delete article (status ${res.status})`);
        }

        await refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete article"
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
            Loading articles...
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
              Articles
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/articles/new"
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
              Create Article
            </Link>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Search & Filter */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles by title or slug..."
            aria-label="Search articles"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500/20"
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Table */}
        <ArticleTable
          articles={articles}
          total={total}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          deletingId={deletingId ?? undefined}
          updatingId={updatingId ?? undefined}
        />

        {/* Pagination */}
        <Pagination
          page={page}
          pages={pages}
          total={total}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          entityName="articles"
        />
      </section>
    </main>
  );
}
