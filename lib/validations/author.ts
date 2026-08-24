import type {
  AuthorCreateInput,
  AuthorValidationResult,
} from "@/lib/types/author";
import { generateSlug } from "@/lib/slug";

const LIMITS = {
  NAME_MIN: 2,
  NAME_MAX: 120,
  BIO_MAX: 2000,
  EMAIL_MAX: 254,
  TWITTER_HANDLE_MAX: 20,
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Validate URL format (basic check without external libraries).
 *
 * Accepts http://, https://, or relative paths starting with /.
 * Returns true if the URL appears valid.
 */
function isValidUrl(input: string): boolean {
  if (!input) return false;

  // Relative paths starting with /
  if (input.startsWith("/")) return true;

  // Absolute URLs with http or https
  try {
    const url = new URL(input);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validate email format (basic RFC 5321 simplified check).
 *
 * Returns true if the email contains exactly one @ with non-empty local
 * and domain parts.
 */
function isValidEmail(input: string): boolean {
  if (!input) return false;

  const parts = input.split("@");
  if (parts.length !== 2) return false;

  const [local, domain] = parts;
  return local.length > 0 && domain.length > 0 && domain.includes(".");
}

/**
 * Strip leading @ from a Twitter handle if present.
 */
function normalizeTwitterHandle(handle: string): string {
  if (handle.startsWith("@")) {
    return handle.slice(1);
  }
  return handle;
}

/**
 * Validate Twitter handle characters (alphanumeric + underscore only).
 */
function isValidTwitterHandleCharacters(handle: string): boolean {
  return /^[a-zA-Z0-9_]+$/.test(handle);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate author input and produce a normalized AuthorCreateInput.
 *
 * Collects all validation errors without throwing. Auto-generates slug from
 * name. Returns a discriminated union indicating success or field-level
 * errors.
 *
 * @param input — Raw input record from the API layer.
 * @returns Validated input on success, or field errors on failure.
 */
export function validateAuthorInput(
  input: Record<string, unknown>
): AuthorValidationResult {
  const errors: Record<string, string> = {};

  // --- Name ----------------------------------------------------------------
  const trimmedName =
    typeof input.name === "string" ? input.name.trim() : "";

  if (!trimmedName) {
    errors.name = "Author name is required";
  } else if (trimmedName.length < LIMITS.NAME_MIN) {
    errors.name = `Author name must be at least ${LIMITS.NAME_MIN} characters`;
  } else if (trimmedName.length > LIMITS.NAME_MAX) {
    errors.name = `Author name must be at most ${LIMITS.NAME_MAX} characters`;
  }

  // --- Bio -----------------------------------------------------------------
  const trimmedBio =
    input.bio !== undefined && input.bio !== null
      ? String(input.bio).trim()
      : "";

  if (trimmedBio.length > LIMITS.BIO_MAX) {
    errors.bio = `Bio must be at most ${LIMITS.BIO_MAX} characters`;
  }

  // --- Photo URL -----------------------------------------------------------
  const trimmedPhotoUrl =
    input.photoUrl !== undefined && input.photoUrl !== null
      ? String(input.photoUrl).trim()
      : "";

  if (trimmedPhotoUrl && !isValidUrl(trimmedPhotoUrl)) {
    errors.photoUrl = "Photo URL must be a valid URL";
  }

  // --- Email ---------------------------------------------------------------
  const trimmedEmail =
    input.email !== undefined && input.email !== null
      ? String(input.email).trim()
      : "";

  if (trimmedEmail.length > LIMITS.EMAIL_MAX) {
    errors.email = `Email must be at most ${LIMITS.EMAIL_MAX} characters`;
  } else if (trimmedEmail && !isValidEmail(trimmedEmail)) {
    errors.email = "Email must be a valid email address";
  }

  // --- Twitter Handle ------------------------------------------------------
  const rawTwitterHandle =
    typeof input.twitterHandle === "string" ? input.twitterHandle : "";

  const normalizedTwitterHandle = rawTwitterHandle
    ? normalizeTwitterHandle(rawTwitterHandle.trim())
    : "";

  if (normalizedTwitterHandle.length > LIMITS.TWITTER_HANDLE_MAX) {
    errors.twitterHandle = `Twitter handle must be at most ${LIMITS.TWITTER_HANDLE_MAX} characters`;
  } else if (normalizedTwitterHandle && !isValidTwitterHandleCharacters(normalizedTwitterHandle)) {
    errors.twitterHandle = "Twitter handle can only contain letters, numbers, and underscores";
  }

  // --- Website URL ---------------------------------------------------------
  const trimmedWebsiteUrl =
    input.websiteUrl !== undefined && input.websiteUrl !== null
      ? String(input.websiteUrl).trim()
      : "";

  if (trimmedWebsiteUrl && !isValidUrl(trimmedWebsiteUrl)) {
    errors.websiteUrl = "Website URL must be a valid URL";
  }

  // --- isActive ------------------------------------------------------------
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

  // --- Return result -------------------------------------------------------
  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      errors,
    };
  }

  const data: AuthorCreateInput = {
    name: trimmedName,
    slug: generateSlug(trimmedName),
    bio: trimmedBio,
    photoUrl: trimmedPhotoUrl,
    email: trimmedEmail,
    twitterHandle: normalizedTwitterHandle,
    websiteUrl: trimmedWebsiteUrl,
    isActive,
  };

  return {
    success: true,
    data,
  };
}
