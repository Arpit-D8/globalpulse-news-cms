/**
 * Admin-specific category types used by presentational components.
 *
 * Mirrors the Category model fields for admin display purposes.
 * Includes all fields the admin table needs to render category data.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single category document as returned by the admin API.
 *
 * Contains all fields from the Category model needed for admin display:
 * name, slug, description, color, icon, displayOrder, isActive, timestamps.
 */
export type AdminCategory = {
  /** Unique MongoDB identifier. */
  _id: string;
  /** Category display name (2–80 characters). */
  name: string;
  /** URL-friendly slug (unique, lowercase). */
  slug: string;
  /** Category description (max 500 characters). */
  description: string;
  /** Hex color code for visual identification (default: "#6b7280"). */
  color: string;
  /** Icon identifier or emoji (default: ""). */
  icon: string;
  /** Sort order among categories (non-negative integer). */
  displayOrder: number;
  /** Whether the category is active (soft-delete toggle). */
  isActive: boolean;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** ISO-8601 last-update timestamp. */
  updatedAt: string;
};

/**
 * Valid category status values used in the admin interface.
 *
 * Categories use a boolean isActive flag, but the admin interface
 * represents this as a human-readable status string.
 */
export type CategoryStatus = "active" | "inactive";

import { toStatus } from "@/lib/utils/status";

/**
 * Convert the boolean isActive flag to a CategoryStatus string.
 *
 * @param isActive - The boolean isActive value from the category document.
 * @returns "active" if true, "inactive" otherwise.
 */
export function toCategoryStatus(isActive: boolean): CategoryStatus {
  return toStatus(isActive);
}

import { ACTIVE_INACTIVE_LABELS } from "./admin-status";

/**
 * Status label mapping for display in the admin table.
 *
 * Maps each CategoryStatus value to its human-readable label.
 */
export const STATUS_LABELS: Record<CategoryStatus, string> =
  ACTIVE_INACTIVE_LABELS as unknown as Record<CategoryStatus, string>;
