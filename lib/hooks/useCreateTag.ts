"use client";

import { useState, useCallback } from "react";
import type { AdminTag } from "@/lib/types/admin-tag";

type FieldErrors = Partial<Record<"name" | "slug" | "description", string>>;

/**
 * Hook for creating a tag via the form.
 *
 * Manages:
 * - Form state (name, slug, description, isActive)
 * - Field-level validation errors
 * - Submission loading state
 * - Submission result
 *
 * Returns:
 * - form: current form values
 * - setForm: setter (replaces useState dispatcher)
 * - errors: field-level validation errors
 * - submitting: whether a create request is in flight
 * - submitError: top-level error message (network / server)
 * - reset: clear form and errors
 * - handleSubmit: validated submit wrapper for <form onSubmit>
 */
export function useCreateTag(onSuccess?: () => void) {
  const [form, setForm] = useState<AdminTag>({
    _id: "",
    name: "",
    slug: "",
    description: "",
    isActive: true,
    createdAt: "",
    updatedAt: "",
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setForm({
      _id: "",
      name: "",
      slug: "",
      description: "",
      isActive: true,
      createdAt: "",
      updatedAt: "",
    });
    setErrors({});
    setSubmitError(null);
  }, []);

  const validate = useCallback((): boolean => {
    const fieldErrors: FieldErrors = {};

    if (!form.name.trim()) {
      fieldErrors.name = "Tag name is required";
    } else if (form.name.trim().length < 2) {
      fieldErrors.name = "Tag name must be at least 2 characters";
    } else if (form.name.trim().length > 80) {
      fieldErrors.name = "Tag name must be at most 80 characters";
    }

    if (form.description.length > 500) {
      fieldErrors.description = "Description must be at most 500 characters";
    }

    setErrors(fieldErrors);
    return Object.keys(fieldErrors).length === 0;
  }, [form.name, form.description]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!validate()) return;

      setSubmitting(true);
      setSubmitError(null);

      try {
        const res = await fetch("/api/admin/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            slug: form.slug || undefined,
            description: form.description,
            isActive: form.isActive,
          }),
        });

        const json = await res.json();
        if (!json.success) {
          throw new Error(json.message ?? "Failed to create tag");
        }

        reset();
        onSuccess?.();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to create tag";
        setSubmitError(message);
      } finally {
        setSubmitting(false);
      }
    },
    [form, validate, reset, onSuccess]
  );

  return {
    form,
    setForm,
    errors,
    submitting,
    submitError,
    handleSubmit,
    reset,
  };
}
