/**
 * Shared active/inactive status labels.
 *
 * Used by admin-tag, admin-author, and admin-category.
 * Article status labels (Draft / Published / Archived) are kept separate
 * in admin-article because they represent a different status domain.
 */

export const ACTIVE_INACTIVE_LABELS = {
  active: "Active",
  inactive: "Inactive",
} as const;
