"use client";

import Image from "next/image";
import { memo } from "react";
import type { AdminMedia } from "@/lib/types/admin-media";
import { formatFileSize, formatDimensions } from "@/lib/types/admin-media";
import { formatAdminDate } from "@/lib/utils/date";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Props for the media card component.
 */
export type MediaCardProps = {
  /** The media asset to display. */
  media: AdminMedia;
  /** When true, shows a thick red border with a check icon. */
  selected?: boolean;
  /** When true, the card is clickable for selection. */
  selectable?: boolean;
  /** ID of the media asset currently being deleted (disables the Delete button). */
  deletingId?: string;
  /** Called when the card is clicked (only when selectable). */
  onSelect?: (media: AdminMedia) => void;
  /** Called when the user clicks the Edit button. */
  onEdit?: (media: AdminMedia) => void;
  /** Called when the user clicks the Delete button. */
  onDelete?: (media: AdminMedia) => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Presentational card component for the admin media library.
 *
 * Displays one media asset with:
 * - Image preview (with placeholder fallback)
 * - Filename and original filename
 * - Dimensions (width × height)
 * - File size (human-readable)
 * - Upload date
 * - Edit and Delete action buttons
 *
 * When selectable=true, the card is clickable and shows a selection border.
 * When selected=true, a thick red border and check icon are displayed.
 *
 * This component is purely presentational — it receives all data through
 * props and exposes callbacks for actions. No API calls, no business logic.
 *
 * Wrapped in `React.memo` to skip re-renders when props are referentially
 * identical.
 */
export const MediaCard = memo(function MediaCard({
  media,
  selected = false,
  selectable = false,
  deletingId,
  onSelect,
  onEdit,
  onDelete,
}: MediaCardProps) {
  const {
    url,
    filename,
    originalName,
    width,
    height,
    size,
    createdAt,
    alt,
  } = media;

  const dimensions = formatDimensions(width, height);
  const fileSize = formatFileSize(size);
  const uploadDate = formatAdminDate(createdAt);
  const isDeleting = deletingId === media._id;

  const cardClasses = [
    "group relative overflow-hidden rounded-xl border bg-white transition",
    selectable ? "cursor-pointer" : "cursor-default",
    selected
      ? "border-2 border-red-600 shadow-md"
      : "border-neutral-200 hover:border-neutral-300",
  ].join(" ");

  return (
    <div
      className={cardClasses}
      onClick={() => {
        if (selectable && onSelect) {
          onSelect(media);
        }
      }}
      role={selectable ? "button" : undefined}
      tabIndex={selectable ? 0 : undefined}
      aria-label={`Media: ${filename}`}
      aria-pressed={selectable ? selected : undefined}
    >
      {/* Selection indicator */}
      {selected && (
        <div className="absolute right-2 top-2 z-10 rounded-full bg-red-600 p-1 shadow-sm">
          <svg
            className="size-3 text-white"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 0 1 1.04-.208Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}

      {/* Image preview */}
      <div className="relative aspect-square w-full bg-neutral-100">
        {url ? (
          <Image
            src={url}
            alt={alt || filename}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <svg
              className="size-12 text-neutral-400"
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
      </div>

      {/* Metadata */}
      <div className="p-4">
        <p className="truncate text-sm font-bold text-neutral-950">
          {filename}
        </p>
        <p className="mt-0.5 truncate text-xs text-neutral-500">
          {originalName}
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
          <span>{dimensions}</span>
          <span>{fileSize}</span>
        </div>
        <p className="mt-1 text-xs text-neutral-400">{uploadDate}</p>

        {/* Action buttons */}
        {(onEdit || onDelete) && (
          <div className="mt-3 flex items-center justify-end gap-2 border-t border-neutral-100 pt-3">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(media);
                }}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-black uppercase text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
                aria-label={`Edit ${filename}`}
                title="Edit media"
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
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(media);
                }}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-black uppercase text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={`Delete ${filename}`}
                title="Delete media"
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
            )}
          </div>
        )}
      </div>
    </div>
  );
});
