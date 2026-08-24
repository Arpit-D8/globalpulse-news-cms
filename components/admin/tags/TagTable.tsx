import { TagRow } from "./TagRow";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import type { AdminTag } from "@/lib/types/admin-tag";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Props for the tags table component.
 */
export type TagTableProps = {
  /** List of tags to display. */
  tags: AdminTag[];
  /** Total tag count (for the header badge). */
  total: number;
  /** Called when the user clicks the Edit button on a row. */
  onEdit?: (tag: AdminTag) => void;
  /** Called when the user clicks the Delete button on a row. */
  onDelete?: (tag: AdminTag) => void;
  /** Called when the user clicks the toggle active/inactive button on a row. */
  onToggle?: (tag: AdminTag) => void;
  /** ID of the tag currently being deleted (disables that row's delete button). */
  deletingId?: string;
  /** ID of the tag currently being toggled (disables that row's toggle button). */
  togglingId?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Presentational table component for the admin tags list.
 *
 * Renders a responsive table with columns for:
 * - Tag name
 * - Slug (monospace)
 * - Description (truncated)
 * - Status badge (Active / Inactive)
 * - Created date
 * - Edit and Delete actions
 *
 * Shows a centered empty state when no tags are provided.
 *
 * This component is purely presentational — it receives all data through
 * props and exposes callbacks for actions. No API calls, no business logic,
 * no pagination, no filtering.
 */
export function TagTable({
  tags,
  total,
  onEdit,
  onDelete,
  onToggle,
  deletingId,
  togglingId,
}: TagTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-6 py-5">
        <h3 className="text-base font-black tracking-tight text-neutral-950">
          Tags
        </h3>
        <span className="text-sm font-semibold text-neutral-500">
          {total} total
        </span>
      </div>

      {/* Empty state */}
      {tags.length === 0 ? (
        <EmptyState
          title="No tags found."
          message="Create your first tag to get started."
        />
      ) : (
        /* Table */
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead className="bg-neutral-50 text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
            <tr>
              <th className="px-6 py-4" scope="col">Name</th>
              <th className="px-6 py-4" scope="col">Slug</th>
              <th className="px-6 py-4" scope="col">Description</th>
              <th className="px-6 py-4" scope="col">Status</th>
              <th className="px-6 py-4" scope="col">Created</th>
              <th className="px-6 py-4" scope="col" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {tags.map((tag) => (
              <TagRow
                key={tag._id}
                tag={tag}
                onEdit={() => onEdit?.(tag)}
                onDelete={() => onDelete?.(tag)}
                onToggle={() => onToggle?.(tag)}
                isDeleting={deletingId === tag._id}
                isToggling={togglingId === tag._id}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
