"use client";

import { AuthorRow } from "./AuthorRow";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import type { AdminAuthor } from "@/lib/types/admin-author";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Props for the authors table component.
 */
export type AuthorTableProps = {
  /** List of authors to display. */
  authors: AdminAuthor[];
  /** Total author count (for the header badge). */
  total: number;
  /** Called when the user clicks the Edit button on a row. */
  onEdit: (author: AdminAuthor) => void;
  /** Called when the user clicks the Delete button on a row. */
  onDelete: (author: AdminAuthor) => void;
  /** ID of the author currently being deleted (disables that row's delete button). */
  deletingId?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Presentational table component for the admin authors list.
 *
 * Renders a responsive table with columns for:
 * - Photo thumbnail
 * - Name
 * - Email
 * - Website link
 * - Twitter handle
 * - Status badge
 * - Created date
 * - Edit and Delete actions
 *
 * Shows a centered empty state when no authors are provided.
 *
 * This component is purely presentational — it receives all data through
 * props and exposes callbacks for actions. No API calls, no business logic,
 * no pagination, no filtering.
 */
export function AuthorTable({
  authors,
  total,
  onEdit,
  onDelete,
  deletingId,
}: AuthorTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-6 py-5">
        <h3 className="text-base font-black tracking-tight text-neutral-950">
          Authors
        </h3>
        <span className="text-sm font-semibold text-neutral-500">
          {total} total
        </span>
      </div>

      {/* Empty state */}
      {authors.length === 0 ? (
        <EmptyState
          title="No authors found."
          message="Create your first author to attribute your newsroom content."
        />
      ) : (
        /* Table */
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead className="bg-neutral-50 text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
            <tr>
              <th className="px-6 py-4" scope="col">Photo</th>
              <th className="px-6 py-4" scope="col">Name</th>
              <th className="px-6 py-4" scope="col">Email</th>
              <th className="px-6 py-4" scope="col">Website</th>
              <th className="px-6 py-4" scope="col">Twitter</th>
              <th className="px-6 py-4" scope="col">Status</th>
              <th className="px-6 py-4" scope="col">Created</th>
              <th className="px-6 py-4" scope="col" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {authors.map((author) => (
              <AuthorRow
                key={author._id}
                author={author}
                onEdit={() => onEdit(author)}
                onDelete={() => onDelete(author)}
                isDeleting={deletingId === author._id}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
