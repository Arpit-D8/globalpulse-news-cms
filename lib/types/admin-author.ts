/**
 * Admin-specific author types used by presentational components.
 *
 * Mirrors the Author model fields for admin display purposes.
 * Includes all fields the admin table needs to render author data.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single author document as returned by the admin API.
 *
 * Contains all fields from the Author model needed for admin display:
 * name, slug, bio, photoUrl, email, twitterHandle, websiteUrl, isActive,
 * and timestamps.
 */
export type AdminAuthor = {
  /** Unique MongoDB identifier. */
  _id: string;
  /** Author display name (2–80 characters). */
  name: string;
  /** URL-friendly slug (unique, lowercase). */
  slug: string;
  /** Author biography (max 2000 characters). */
  bio: string;
  /** URL to the author's profile photo. */
  photoUrl: string;
  /** Author email address (optional). */
  email: string;
  /** Twitter/X handle (optional). */
  twitterHandle: string;
  /** Personal or professional website URL (optional). */
  websiteUrl: string;
  /** Whether the author is active (soft-delete toggle). */
  isActive: boolean;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** ISO-8601 last-update timestamp. */
  updatedAt: string;
};

/**
 * Valid author status values used in the admin interface.
 *
 * Authors use a boolean isActive flag, but the admin interface
 * represents this as a human-readable status string.
 */
export type AuthorStatus = "active" | "inactive";

import { toStatus } from "@/lib/utils/status";

/**
 * Convert the boolean isActive flag to an AuthorStatus string.
 *
 * @param isActive - The boolean isActive value from the author document.
 * @returns "active" if true, "inactive" otherwise.
 */
export function toAuthorStatus(isActive: boolean): AuthorStatus {
  return toStatus(isActive);
}

import { ACTIVE_INACTIVE_LABELS } from "./admin-status";

/**
 * Status label mapping for display in the admin table.
 *
 * Maps each AuthorStatus value to its human-readable label.
 */
export const STATUS_LABELS: Record<AuthorStatus, string> =
  ACTIVE_INACTIVE_LABELS as unknown as Record<AuthorStatus, string>;
