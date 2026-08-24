"use client";

import { useState, useCallback } from "react";
import type { CategoryCreateInput } from "@/lib/types/category";
import { useCategoryMutations } from "@/lib/hooks/useCategoryMutations";

type FieldErrors = Partial<Record<keyof CategoryCreateInput, string>>;

/**
 * Hook for creating a category via the modal form.
 *
 * Reuses useCategoryMutations for the actual create operation.
 * Manages:
 * - Form state (name, description, displayOrder, color, icon, isActive)
 * - Field-level validation errors
 * - Submission loading state (per-form, not global mutation state)
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
export function useCreateCategory(onSuccess?: () => void) {
  const [form, setForm] = useState<CategoryCreateInput>({
    name: "",
    slug: "",
    description: "",
    displayOrder: 0,
    color: "#6b7280",
    icon: "",
    isActive: true,
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { create } = useCategoryMutations();

  const reset = useCallback(() => {
    setForm({
      name: "",
      slug: "",
      description: "",
      displayOrder: 0,
      color: "#6b7280",
      icon: "",
      isActive: true,
    });
    setErrors({});
    setSubmitError(null);
  }, []);

  const validate = useCallback((): boolean => {
    const fieldErrors: FieldErrors = {};

    if (!form.name.trim()) {
      fieldErrors.name = "Category name is required";
    } else if (form.name.trim().length < 2) {
      fieldErrors.name = "Category name must be at least 2 characters";
    } else if (form.name.trim().length > 50) {
      fieldErrors.name = "Category name must be at most 50 characters";
    }

    if (form.description.length > 500) {
      fieldErrors.description = "Description must be at most 500 characters";
    }

    const order = form.displayOrder;
    if (!Number.isInteger(order) || order < 0) {
      fieldErrors.displayOrder = "Display order must be a non-negative integer";
    }

    setErrors(fieldErrors);
    return Object.keys(fieldErrors).length === 0;
  }, [form.name, form.description, form.displayOrder]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!validate()) return;

      setSubmitting(true);
      setSubmitError(null);

      try {
        await create(form);
        reset();
        onSuccess?.();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to create category";
        setSubmitError(message);
      } finally {
        setSubmitting(false);
      }
    },
    [form, validate, reset, onSuccess, create]
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
