"use client";

import Image from "next/image";
import { memo } from "react";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import {
  type AdminArticle,
  type AdminArticleStatus,
  type ArticleAuthor,
  type ArticleCategory,
  STATUS_LABELS,
} from "@/lib/types/admin-article";
import { formatAdminDate } from "@/lib/utils/date";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Props for the article row component.
 */
export type ArticleRowProps = {
  article: AdminArticle;
  onEdit: (article: AdminArticle) => void;
  onDelete: (article: AdminArticle) => void;
  /** Called when the user triggers a status change (publish/archive/unpublish). */
  onStatusChange?: (article: AdminArticle, status: AdminArticleStatus) => void;
  /** When set, disables the Delete button for this row. */
  isDeleting?: boolean;
  /** When set, disables the status change button for this row. */
  isUpdating?: boolean;
};

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Determine whether a status is considered "active" for the badge component.
 */
function isActiveStatus(status: AdminArticleStatus): boolean {
  return status === "published";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Presentational row component for the articles table.
 *
 * Displays one article with:
 * - Featured image thumbnail (with placeholder fallback)
 * - Title and summary (truncated)
 * - Category name
 * - Author name with optional photo
 * - Status badge
 * - Featured badge (Yes / No)
 * - Published date
 * - Edit and Delete action buttons
 *
 * This component is purely presentational — it receives all data through
 * props and exposes callbacks for actions. No API calls, no business logic.
 *
 * Wrapped in `React.memo` to skip re-renders when props are referentially
 * identical.
 */
export const ArticleRow = memo(function ArticleRow({
  article,
  onEdit,
  onDelete,
  onStatusChange,
  isDeleting,
  isUpdating,
}: ArticleRowProps) {
  const {
    title,
    slug,
    summary,
    featuredImage,
    author,
    category,
    status,
    isFeatured,
    publishedAt,
  } = article;

  /** Determine the status change action button for this article's current state. */
  const statusAction = (() => {
    if (!onStatusChange) return null;

    switch (status) {
      case "draft":
        return {
          label: "Publish",
          targetStatus: "published" as AdminArticleStatus,
          className:
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-black uppercase text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40",
          icon: (
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
                d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9"
              />
            </svg>
          ),
        };
      case "published":
        return {
          label: "Archive",
          targetStatus: "archived" as AdminArticleStatus,
          className:
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-black uppercase text-amber-600 transition hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-40",
          icon: (
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
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
              />
            </svg>
          ),
        };
      case "archived":
        return {
          label: "Unarchive",
          targetStatus: "draft" as AdminArticleStatus,
          className:
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-black uppercase text-blue-600 transition hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40",
          icon: (
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
                d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
              />
            </svg>
          ),
        };
      default:
        return null;
    }
  })();

  return (
    <tr className="transition hover:bg-neutral-50">
      {/* Featured Image */}
      <td className="px-6 py-4">
        {featuredImage ? (
          <Image
            src={featuredImage}
            alt={title}
            width={64}
            height={48}
            className="size-16 rounded-md object-cover"
            unoptimized
          />
        ) : (
          <div className="flex size-16 items-center justify-center rounded-md bg-neutral-200">
            <svg
              className="size-6 text-neutral-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
              />
            </svg>
          </div>
        )}
      </td>

      {/* Title & Summary */}
      <td className="px-6 py-4">
        <p className="text-sm font-bold text-neutral-950">{title}</p>
        <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
          {summary}
        </p>
        <p className="mt-1 font-mono text-[10px] text-neutral-400">{slug}</p>
      </td>

      {/* Category */}
      <td className="px-6 py-4">
        <span className="inline-block rounded bg-neutral-100 px-2 py-1 text-xs font-bold text-neutral-700">
          {category.name}
        </span>
      </td>

      {/* Author */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {(() => {
            // Handle author that may be a string (ObjectId), empty string, or object.
            const authorObj =
              typeof author === "object" && author !== null
                ? (author as ArticleAuthor)
                : null;
            const authorName = authorObj?.name ?? "Unknown";
            const authorPhotoUrl = authorObj?.photoUrl;
            const initial = authorName.charAt(0).toUpperCase();

            return (
              <>
                {authorPhotoUrl ? (
                  <Image
                    src={authorPhotoUrl}
                    alt={authorName}
                    width={24}
                    height={24}
                    className="size-6 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex size-6 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-black text-neutral-500">
                    {initial}
                  </div>
                )}
                <span className="text-sm font-semibold text-neutral-700">
                  {authorName}
                </span>
              </>
            );
          })()}
        </div>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <StatusBadge
          label={STATUS_LABELS[status]}
          active={isActiveStatus(status)}
        />
      </td>

      {/* Featured */}
      <td className="px-6 py-4">
        {isFeatured ? (
          <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-1 text-[10px] font-black uppercase text-amber-800">
            <svg
              className="size-3"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                clipRule="evenodd"
              />
            </svg>
            Yes
          </span>
        ) : (
          <span className="text-xs text-neutral-400">No</span>
        )}
      </td>

      {/* Published Date */}
      <td className="px-6 py-4">
        <span className="text-sm text-neutral-500">
          {formatAdminDate(publishedAt)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {statusAction && onStatusChange && (
            <button
              type="button"
              onClick={() => onStatusChange(article, statusAction.targetStatus)}
              disabled={isUpdating}
              className={statusAction.className}
              aria-label={`${statusAction.label} ${title}`}
              title={`Change status to ${STATUS_LABELS[statusAction.targetStatus]}`}
            >
              {statusAction.icon}
              {statusAction.label}
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(article)}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-black uppercase text-neutral-600 transition hover:bg-neutral-200 hover:text-neutral-900"
            aria-label={`Edit ${title}`}
            title="Edit article"
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
            onClick={() => onDelete(article)}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-black uppercase text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Delete ${title}`}
            title="Delete article"
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
