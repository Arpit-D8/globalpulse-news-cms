"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CATEGORY_CONFIG, CATEGORIES } from "@/lib/constants";
import { DeleteArticleButton } from "@/components/admin/DeleteArticleButton";
import type { Article } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safely resolve a category slug from a category name string.
 * Falls back to "India" when the name doesn't match any CATEGORY_CONFIG key.
 */
function getCategorySlug(categoryName: string): string {
  const config = CATEGORY_CONFIG[categoryName as keyof typeof CATEGORY_CONFIG];
  return config?.slug ?? CATEGORY_CONFIG.India.slug;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ArticleRow = Article & { _id: string };

type ArticleListResponse = {
  success: true;
  data: {
    articles: ArticleRow[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ArticlesTable() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);

  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // -----------------------------------------------------------------------
  // Fetch
  // -----------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadArticles() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });

      if (search.trim()) params.set("search", search.trim());
      if (category) params.set("category", category);
      if (status) params.set("status", status);
      params.set("sort", sort);

      try {
        const response = await fetch(`/api/articles?${params}`);
        const result = (await response.json()) as ArticleListResponse;

        if (!response.ok || !result.success) {
          throw new Error(result.data?.articles ? "" : "Failed to load articles.");
        }

        if (!cancelled) {
          setArticles(result.data.articles);
          setPagination(result.data.pagination);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load articles.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadArticles();

    return () => {
      cancelled = true;
    };
  }, [search, category, status, sort, page]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSearch(event.target.value);
    setPage(1);
  }

  function handleCategoryChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setCategory(event.target.value);
    setPage(1);
  }

  function handleStatusChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setStatus(event.target.value);
    setPage(1);
  }

  function handleSortChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setSort(event.target.value as "newest" | "oldest");
    setPage(1);
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <>
      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search headline…"
          value={search}
          onChange={handleSearchChange}
          className="cms-input min-w-[220px]"
        />

        <select
          value={category}
          onChange={handleCategoryChange}
          className="cms-input"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={handleStatusChange}
          className="cms-input"
        >
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>

        <select
          value={sort}
          onChange={handleSortChange}
          className="cms-input"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {/* ── Loading / Error / Empty ────────────────────────────────────── */}
      {loading && (
        <div className="px-6 py-12 text-center text-sm font-semibold text-neutral-500">
          Loading…
        </div>
      )}

      {!loading && error && (
        <div className="px-6 py-12 text-center text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && articles.length === 0 && (
        <div className="px-6 py-12 text-center text-sm font-semibold text-neutral-500">
          No articles found.
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────── */}
      {!loading && !error && articles.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="bg-neutral-50 text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                <tr>
                  <th className="px-6 py-4">Headline</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Updated</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {articles.map((article) => (
                  <tr
                    key={article._id}
                    className="align-top transition hover:bg-neutral-50"
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-neutral-950">
                        {article.title}
                      </p>
                      <p className="mt-1 max-w-xl text-sm leading-6 text-neutral-500">
                        {article.summary}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/category/${getCategorySlug(article.category)}`}
                        className="font-bold text-red-700 hover:underline"
                      >
                        {article.category}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-black uppercase ${
                          article.status === "published"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {article.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-neutral-600">
                      {new Intl.DateTimeFormat("en", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(article.updatedAt))}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {article.status === "published" && (
                          <Link
                            href={`/articles/${article.slug}`}
                            title="Open article"
                            className="inline-grid size-9 place-items-center border border-neutral-300 text-neutral-700 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white"
                          >
                            <OpenArticleIcon />
                          </Link>
                        )}
                        <Link
                          href={`/admin/articles/${article._id}/edit`}
                          title="Edit article"
                          className="inline-grid size-9 place-items-center border border-neutral-300 text-neutral-700 transition hover:border-red-700 hover:bg-red-700 hover:text-white"
                        >
                          <EditArticleIcon />
                        </Link>
                        <DeleteArticleButton
                          articleId={article._id}
                          title={article.title}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ─────────────────────────────────────────────── */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4">
              <p className="text-sm font-semibold text-neutral-500">
                Page {pagination.page} of {pagination.pages}{" "}
                ({pagination.total} total)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="inline-flex items-center gap-1 border border-neutral-300 px-3 py-1.5 text-sm font-bold text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(pagination.pages, p + 1))
                  }
                  disabled={pagination.page >= pagination.pages}
                  className="inline-flex items-center gap-1 border border-neutral-300 px-3 py-1.5 text-sm font-bold text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Icons (inline to avoid extra dependencies)
// ---------------------------------------------------------------------------

function OpenArticleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function EditArticleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
