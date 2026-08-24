import type {
  CategoryCreateInput,
  CategoryValidationResult,
} from "@/lib/types/category";
import { generateSlug } from "@/lib/slug";

const LIMITS = {
  NAME_MIN: 2,
  NAME_MAX: 80,
  DESCRIPTION_MAX: 500,
  COLOR_MAX: 20,
  ICON_MAX: 50,
} as const;

export function validateCategoryInput(
  input: Record<string, unknown>
): CategoryValidationResult {
  const errors: Record<string, string> = {};

  const trimmedName =
    typeof input.name === "string" ? input.name.trim() : "";

  if (!trimmedName) {
    errors.name = "Category name is required";
  } else if (trimmedName.length < LIMITS.NAME_MIN) {
    errors.name = `Category name must be at least ${LIMITS.NAME_MIN} characters`;
  } else if (trimmedName.length > LIMITS.NAME_MAX) {
    errors.name = `Category name must be at most ${LIMITS.NAME_MAX} characters`;
  }

  const trimmedDescription =
    input.description !== undefined && input.description !== null
      ? String(input.description).trim()
      : "";

  if (trimmedDescription.length > LIMITS.DESCRIPTION_MAX) {
    errors.description = `Description must be at most ${LIMITS.DESCRIPTION_MAX} characters`;
  }

  const displayOrder =
    input.displayOrder !== undefined && input.displayOrder !== null
      ? Number(input.displayOrder)
      : 0;

  if (!Number.isInteger(displayOrder) || displayOrder < 0) {
    errors.displayOrder =
      "Display order must be a non-negative integer";
  }

  const trimmedColor =
    input.color !== undefined && input.color !== null
      ? String(input.color).trim()
      : "#6b7280";

  if (trimmedColor.length > LIMITS.COLOR_MAX) {
    errors.color = "Color value is too long";
  }

  const trimmedIcon =
    input.icon !== undefined && input.icon !== null
      ? String(input.icon).trim()
      : "";

  if (trimmedIcon.length > LIMITS.ICON_MAX) {
    errors.icon = "Icon value is too long";
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      errors,
    };
  }

  const data: CategoryCreateInput = {
    name: trimmedName,
    slug: generateSlug(trimmedName),
    description: trimmedDescription,
    color: trimmedColor,
    icon: trimmedIcon,
    displayOrder,
    isActive: input.isActive !== false,
  };

  return {
    success: true,
    data,
  };
}