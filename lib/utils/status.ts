/**
 * Shared status conversion utility for admin modules.
 *
 * Tags, authors, and categories all use the same active/inactive status
 * domain. This module provides a single source of truth for converting the
 * boolean isActive flag to a human-readable status string.
 */

/**
 * Convert the boolean isActive flag to a human-readable status string.
 *
 * @param isActive - The boolean isActive value.
 * @returns "active" if true, "inactive" otherwise.
 */
export function toStatus(isActive: boolean): "active" | "inactive" {
  return isActive ? "active" : "inactive";
}
