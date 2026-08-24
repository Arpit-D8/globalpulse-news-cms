import type {
  TagCreateInput,
  TagValidationResult,
} from "@/lib/types/tag";
import { generateSlug } from "@/lib/slug";

const LIMITS = {
  NAME_MIN: 2,
  NAME_MAX: 80,
  DESCRIPTION_MAX: 500,
} as const;

export function validateTagInput(
  input: Record<string, unknown>
): TagValidationResult {
  const errors: Record<string, string> = {};

  const trimmedName =
    typeof input.name === "string" ? input.name.trim() : "";

  if (!trimmedName) {
    errors.name = "Tag name is required";
  } else if (trimmedName.length < LIMITS.NAME_MIN) {
    errors.name = `Tag name must be at least ${LIMITS.NAME_MIN} characters`;
  } else if (trimmedName.length > LIMITS.NAME_MAX) {
    errors.name = `Tag name must be at most ${LIMITS.NAME_MAX} characters`;
  }

  const trimmedDescription =
    input.description !== undefined && input.description !== null
      ? String(input.description).trim()
      : "";

  if (trimmedDescription.length > LIMITS.DESCRIPTION_MAX) {
    errors.description = `Description must be at most ${LIMITS.DESCRIPTION_MAX} characters`;
  }

  const rawIsActive = input.isActive;

  let isActive: boolean;

  if (rawIsActive === undefined) {
    isActive = true;
  } else if (typeof rawIsActive !== "boolean") {
    errors.isActive = "isActive must be a boolean";
    isActive = true;
  } else {
    isActive = rawIsActive;
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      errors,
    };
  }

  const data: TagCreateInput = {
    name: trimmedName,
    slug: generateSlug(trimmedName),
    description: trimmedDescription,
    isActive,
  };

  return {
    success: true,
    data,
  };
}
