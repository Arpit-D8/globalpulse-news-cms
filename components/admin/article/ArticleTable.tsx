import { ArticleRow } from "./ArticleRow";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import type { AdminArticle } from "@/lib/types/admin-article";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Props for the articles table component.
 */
export type ArticleTableProps = {
  /** List of articles to display. */
  articles: AdminArticle[];
  /** Total article count (for the header badge). */
  total: number;
  /** Called when the user clicks the Edit button on a row. */
  onEdit?: (article: AdminArticle) => void;
  /** Called when the user clicks the Delete button on a row. */
  onDelete?: (article: AdminArticle) => void;
  /** Called when the user triggers a status change on a row. */
  onStatusChange?: (article: AdminArticle, status: "draft" | "published" | "archived") => void;
  /** ID of the article currently being deleted (disables that row's delete button). */
  deletingId?: string;
  /** ID of the article currently being updated (disables that row's status change button). */
  updatingId?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Presentational table component for the admin articles list.
 *
 * Renders a responsive table with columns for:
 * - Featured image thumbnail
 * - Title, slug, and summary
 * - Category
 * - Author
 * - Status badge
 * - Featured badge
 * - Published date
 * - Edit and Delete actions
 *
 * Shows a centered empty state when no articles are provided.
 *
 * This component is purely presentational — it receives all data through
 * props and exposes callbacks for actions. No API calls, no business logic,
 * no pagination, no filtering.
 */
export function ArticleTable({
  articles,
  total,
  onEdit,
  onDelete,
  onStatusChange,
  deletingId,
  updatingId,
}: ArticleTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-6 py-5">
        <h3 className="text-base font-black tracking-tight text-neutral-950">
          Articles
        </h3>
        <span className="text-sm font-semibold text-neutral-500">
          {total} total
        </span>
      </div>

      {/* Empty state */}
      {articles.length === 0 ? (
        <EmptyState
          title="No articles found."
          message="Create your first article to get started."
        />
      ) : (
        /* Table */
        <table className="w-full min-w-[1100px] border-collapse text-left">
          <thead className="bg-neutral-50 text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
            <tr>
              <th className="px-6 py-4" scope="col">Image</th>
              <th className="px-6 py-4" scope="col">Article</th>
              <th className="px-6 py-4" scope="col">Category</th>
              <th className="px-6 py-4" scope="col">Author</th>
              <th className="px-6 py-4" scope="col">Status</th>
              <th className="px-6 py-4" scope="col">Featured</th>
              <th className="px-6 py-4" scope="col">Published</th>
              <th className="px-6 py-4" scope="col" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {articles.map((article) => (
              <ArticleRow
                key={article._id}
                article={article}
                onEdit={() => onEdit?.(article)}
                onDelete={() => onDelete?.(article)}
                onStatusChange={(a, status) => onStatusChange?.(a, status)}
                isDeleting={deletingId === article._id}
                isUpdating={updatingId === article._id}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
