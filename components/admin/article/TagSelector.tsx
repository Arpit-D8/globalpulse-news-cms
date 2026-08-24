"use client";

import { useEffect, useState, useCallback } from "react";
import { tagClient } from "@/lib/api/tagClient";
import type { AdminTag } from "@/lib/types/admin-tag";

type TagSelectorProps = {
  value: string[]; // Array of Tag _id strings
  onChange: (tagIds: string[]) => void;
  disabled?: boolean;
  error?: string;
};

/**
 * Reusable multi-select component for choosing managed Tags.
 *
 * Fetches active Tags from the admin API, displays them as selectable chips,
 * and submits only Tag._id values (24-character ObjectId strings).
 *
 * Features:
 * - Fetches active managed Tags on mount
 * - Displays human-readable Tag.name
 * - Supports multiple tag selection via clickable chips
 * - Allows removing selected tags by clicking them again
 * - No free-form input (prevents invalid tag creation)
 * - Handles loading, error, and empty states
 * - Avoids duplicate selections
 */
export function TagSelector({ value, onChange, disabled, error }: TagSelectorProps) {
  const [tags, setTags] = useState<AdminTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const activeTags = await tagClient.getAll();
        if (!cancelled) {
          setTags(activeTags);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setFetchError(err instanceof Error ? err.message : "Failed to fetch tags");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleTag = useCallback(
    (tagId: string) => {
      if (value.includes(tagId)) {
        onChange(value.filter((id) => id !== tagId));
      } else {
        onChange([...value, tagId]);
      }
    },
    [value, onChange]
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Loading tags…
      </div>
    );
  }

  if (fetchError) {
    return (
      <p className="text-sm text-red-600" role="alert">
        {fetchError}
      </p>
    );
  }

  if (tags.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No active tags available. Create tags in the Tag management section.
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = value.includes(tag._id);
          return (
            <button
              key={tag._id}
              type="button"
              disabled={disabled}
              onClick={() => toggleTag(tag._id)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                isSelected
                  ? "bg-red-700 text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              aria-pressed={isSelected}
            >
              {tag.name}
              {isSelected && " ✓"}
            </button>
          );
        })}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {value.length > 0 && (
        <p className="mt-2 text-xs text-neutral-500">
          {value.length} tag{value.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}
