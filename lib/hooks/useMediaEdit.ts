"use client";

import { useState, useCallback } from "react";

import type { AdminMedia } from "@/lib/types/admin-media";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UseMediaEditOptions = {
  media: AdminMedia;
  onSuccess?: (media: AdminMedia) => void;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook for editing alt text via PATCH /api/admin/media/[id].
 *
 * Manages:
 * - Form state (alt text)
 * - Submission loading state
 * - Submission error state
 * - Field-level validation errors
 *
 * Returns:
 * - form: current form values
 * - setForm: setter for form values
 * - errors: field-level validation errors
 * - submitting: whether a request is in flight
 * - submitError: top-level error message
 * - reset: clear form and errors
 * - handleSubmit: validated submit wrapper
 */
export function useMediaEdit({ media, onSuccess }: UseMediaEditOptions) {
  const [alt, setAlt] = useState(media.alt ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setAlt(media.alt ?? "");
    setErrors({});
    setSubmitError(null);
  }, [media.alt]);

  const validate = useCallback((): boolean => {
    const fieldErrors: Record<string, string> = {};

    if (alt.trim().length > 200) {
      fieldErrors.alt = "Alt text must be at most 200 characters";
    }

    setErrors(fieldErrors);
    return Object.keys(fieldErrors).length === 0;
  }, [alt]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!validate()) return;

      setSubmitting(true);
      setSubmitError(null);

      try {
        const response = await fetch(`/api/admin/media/${media._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alt: alt.trim() }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.error?.message || "Failed to update alt text");
        }

        const result = await response.json();
        onSuccess?.(result.data);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to update alt text";
        setSubmitError(message);
      } finally {
        setSubmitting(false);
      }
    },
    [media._id, alt, validate, onSuccess]
  );

  return {
    alt,
    setAlt,
    errors,
    submitting,
    submitError,
    handleSubmit,
    reset,
  };
}
