/**
 * Admin-specific tag types used by presentational components.
 *
 * Mirrors the Tag model fields for admin display purposes.
 * Includes all fields the admin table needs to render tag data.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single tag document as returned by the admin API.
 *
 * Contains all fields from the Tag model needed for admin display:
 * name, slug, description, isActive, and timestamps.
 */
export type AdminTag = {
  /** Unique MongoDB identifier. */
  _id: string;
  /** Tag display name (2–80 characters). */
  name: string;
  /** URL-friendly slug (unique, lowercase). */
  slug: string;
  /** Tag description (max 500 characters). */
  description: string;
  /** Whether the tag is active (soft-delete toggle). */
  isActive: boolean;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** ISO-8601 last-update timestamp. */
  updatedAt: string;
};

/**
 * Valid tag status values used in the admin interface.
 *
 * Tags use a boolean isActive flag, but the admin interface
 * represents this as a human-readable status string.
 */
export type TagStatus = "active" | "inactive";

import { toStatus } from "@/lib/utils/status";

/**
 * Convert the boolean isActive flag to a TagStatus string.
 *
 * @param isActive - The boolean isActive value from the tag document.
 * @returns "active" if true, "inactive" otherwise.
 */
export function toTagStatus(isActive: boolean): TagStatus {
  return toStatus(isActive);
}

import { ACTIVE_INACTIVE_LABELS } from "./admin-status";

/**
 * Status label mapping for display in the admin table.
 *
 * Maps each TagStatus value to its human-readable label.
 */
export const STATUS_LABELS: Record<TagStatus, string> =
  ACTIVE_INACTIVE_LABELS as unknown as Record<TagStatus, string>;
