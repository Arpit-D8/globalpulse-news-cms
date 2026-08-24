import { memo } from "react";

import { MediaCard } from "./MediaCard";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import type { AdminMedia } from "@/lib/types/admin-media";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Props for the media grid component.
 */
export type MediaGridProps = {
  /** List of media assets to display. */
  media: AdminMedia[];
  /** IDs of currently selected media assets. */
  selectedIds?: string[];
  /** When true, cards are clickable for selection. */
  selectable?: boolean;
  /** ID of the media asset currently being deleted (disables that card's delete button). */
  deletingId?: string;
  /** Called when the user clicks a card for selection. */
  onSelect?: (media: AdminMedia) => void;
  /** Called when the user clicks the Edit button on a card. */
  onEdit?: (media: AdminMedia) => void;
  /** Called when the user clicks the Delete button on a card. */
  onDelete?: (media: AdminMedia) => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Responsive grid component that renders a list of MediaCard components.
 *
 * Displays media items in a responsive grid:
 * - 1 column on mobile
 * - 2 columns on small screens
 * - 3 columns on medium screens
 * - 4 columns on large screens
 *
 * Shows a centered empty state when no media items are provided.
 *
 * Pure presentational component — it receives all data through props
 * and exposes callbacks for actions. No API calls, no business logic,
 * no pagination, no filtering.
 *
 * When `selectable` is true, cards enter selection mode. The card IDs
 * matching `selectedIds` are visually highlighted. Clicking a card
 * invokes `onSelect`.
 *
 * Follows the same architecture as ArticleTable and CategoryTable:
 * - Named export
 * - Exported prop types
 * - EmptyState component for empty state
 * - `deletingId` prop (component resolves to boolean internally)
 */
export const MediaGrid = memo(function MediaGrid({
  media,
  selectedIds,
  selectable,
  deletingId,
  onSelect,
  onEdit,
  onDelete,
}: MediaGridProps) {
  if (media.length === 0) {
    return (
      <EmptyState
        title="No media found."
        message="Upload your first image or change the search filters."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {media.map((item) => (
        <MediaCard
          key={item._id}
          media={item}
          selected={selectedIds?.includes(item._id)}
          selectable={selectable}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          deletingId={deletingId}
        />
      ))}
    </div>
  );
});
