"use client";

import Image from "next/image";
import { memo } from "react";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import {
  type AdminAuthor,
  type AuthorStatus,
  STATUS_LABELS,
  toAuthorStatus,
} from "@/lib/types/admin-author";
import { formatAdminDate } from "@/lib/utils/date";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Props for the author row component.
 */
export type AuthorRowProps = {
  author: AdminAuthor;
  onEdit: (author: AdminAuthor) => void;
  onDelete: (author: AdminAuthor) => void;
  /** When set, disables the Delete button for this row. */
  isDeleting?: boolean;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Presentational row component for the authors table.
 *
 * Displays one author with:
 * - Photo thumbnail (with placeholder fallback)
 * - Name
 * - Email
 * - Website link
 * - Twitter handle
 * - Status badge
 * - Created date
 * - Edit and Delete action buttons
 *
 * This component is purely presentational — it receives all data through
 * props and exposes callbacks for actions. No API calls, no business logic.
 *
 * Wrapped in `React.memo` to skip re-renders when props are referentially
 * identical.
 */
export const AuthorRow = memo(function AuthorRow({
  author,
  onEdit,
  onDelete,
  isDeleting,
}: AuthorRowProps) {
  const { name, email, photoUrl, websiteUrl, twitterHandle, isActive, createdAt } = author;

  return (
    <tr className="transition hover:bg-neutral-50">
      {/* Photo */}
      <td className="px-6 py-4">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={name}
            width={40}
            height={40}
            className="size-10 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="flex size-10 items-center justify-center rounded-full bg-neutral-200 text-sm font-black text-neutral-500">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </td>

      {/* Name */}
      <td className="px-6 py-4 font-bold text-neutral-950">
        {name}
      </td>

      {/* Email */}
      <td className="px-6 py-4 text-sm text-neutral-600">
        {email || "—"}
      </td>

      {/* Website */}
      <td className="px-6 py-4 text-sm text-neutral-600">
        {websiteUrl ? (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-red-700 hover:underline"
          >
            Visit
            <svg
              className="size-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
          </a>
        ) : (
          <span className="text-neutral-400">—</span>
        )}
      </td>

      {/* Twitter */}
      <td className="px-6 py-4 text-sm text-neutral-600">
        {twitterHandle ? (
          <span className="inline-flex items-center gap-1">
            {twitterHandle}
          </span>
        ) : (
          <span className="text-neutral-400">—</span>
        )}
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <StatusBadge
          label={STATUS_LABELS[toAuthorStatus(isActive)]}
          active={isActive}
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
            onClick={() => onEdit(author)}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-black uppercase text-neutral-600 transition hover:bg-neutral-200 hover:text-neutral-900"
            aria-label={`Edit ${name}`}
            title="Edit author"
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
            onClick={() => onDelete(author)}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-black uppercase text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Delete ${name}`}
            title="Delete author"
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
