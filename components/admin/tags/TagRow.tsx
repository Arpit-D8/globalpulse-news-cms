"use client";

import { memo } from "react";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import {
  type AdminTag,
  type TagStatus,
  STATUS_LABELS,
  toTagStatus,
} from "@/lib/types/admin-tag";
import { formatAdminDate } from "@/lib/utils/date";
import { truncate } from "@/lib/utils/string";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Props for the tag row component.
 */
export type TagRowProps = {
  /** The tag document to render. */
  tag: AdminTag;
  /** Called when the user clicks the Edit button. */
  onEdit: (tag: AdminTag) => void;
  /** Called when the user clicks the Delete button. */
  onDelete: (tag: AdminTag) => void;
  /** Called when the user clicks the toggle active/inactive button. */
  onToggle?: (tag: AdminTag) => void;
  /** When set, disables the Delete button for this row. */
  isDeleting?: boolean;
  /** When set, disables the Toggle button for this row. */
  isToggling?: boolean;
};

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Determine whether a tag status is considered "active" for the badge component.
 *
 * @param status - The tag status string.
 * @returns true if the status is "active", false otherwise.
 */
function isActiveStatus(status: TagStatus): boolean {
  return status === "active";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Presentational row component for the tags table.
 *
 * Displays one tag with:
 * - Name
 * - Slug (monospace)
 * - Description (truncated)
 * - Status badge (Active / Inactive)
 * - Created date
 * - Edit and Delete action buttons
 *
 * This component is purely presentational — it receives all data through
 * props and exposes callbacks for actions. No API calls, no business logic.
 *
 * Wrapped in `React.memo` to skip re-renders when props are referentially
 * identical.
 */
export const TagRow = memo(function TagRow({
  tag,
  onEdit,
  onDelete,
  onToggle,
  isDeleting,
  isToggling,
}: TagRowProps) {
  const { name, slug, description, createdAt } = tag;
  const status = toTagStatus(tag.isActive);

  const handleToggle = () => {
    if (tag.isActive) {
      const confirmed = window.confirm(`Deactivate "${name}"?`);
      if (!confirmed) return;
    } else {
      const confirmed = window.confirm(`Activate "${name}"?`);
      if (!confirmed) return;
    }
    onToggle?.(tag);
  };

  return (
    <tr className="transition hover:bg-neutral-50">
      {/* Name */}
      <td className="px-6 py-4">
        <p className="text-sm font-bold text-neutral-950">{name}</p>
      </td>

      {/* Slug */}
      <td className="px-6 py-4">
        <p className="font-mono text-xs text-neutral-500">{slug}</p>
      </td>

      {/* Description */}
      <td className="px-6 py-4">
        <p className="line-clamp-2 text-xs text-neutral-500">
          {truncate(description)}
        </p>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <StatusBadge
          label={STATUS_LABELS[status]}
          active={isActiveStatus(status)}
        />
      </td>

      {/* Created Date */}
      <td className="px-6 py-4">
        <span className="text-sm text-neutral-500">
          {formatAdminDate(createdAt)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(tag)}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-black uppercase text-neutral-600 transition hover:bg-neutral-200 hover:text-neutral-900"
            aria-label={`Edit ${name}`}
            title="Edit tag"
          >
            <svg
              className="size-3.5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
              />
            </svg>
            Edit
          </button>
          <button
            type="button"
            onClick={handleToggle}
            disabled={isToggling}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-black uppercase transition hover:bg-neutral-200 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40 ${
              tag.isActive
                ? "text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                : "text-green-600 hover:bg-green-50 hover:text-green-700"
            }`}
            aria-label={`${tag.isActive ? 'Deactivate' : 'Activate'} ${name}`}
            title={tag.isActive ? 'Deactivate tag' : 'Activate tag'}
          >
            {isToggling ? (
              <svg
                className="size-3.5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            ) : (
              <svg
                className="size-3.5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            )}
            {tag.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            type="button"
            onClick={() => onDelete(tag)}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-black uppercase text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Delete ${name}`}
            title="Delete tag"
          >
            <svg
              className="size-3.5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
});
