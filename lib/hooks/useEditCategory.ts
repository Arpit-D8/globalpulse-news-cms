"use client";

import { useState, useCallback } from "react";
import type { Category, CategoryCreateInput, CategoryUpdateInput } from "@/lib/types/category";
import { useCategoryMutations } from "@/lib/hooks/useCategoryMutations";

type FieldErrors = Partial<Record<keyof CategoryCreateInput, string>>;

/**
 * Hook for editing an existing category via the modal form.
 *
 * Reuses useCategoryMutations for the actual update operation.
 * Reuses the same validation rules as useCreateCategory but:
 * - Pre-fills the form with the provided category data
 * - Submits via useCategoryMutations.update() (PUT /api/admin/categories/[id])
 * - Preserves the original slug (read-only on server side)
 *
 * Returns:
 * - form: current form values (CategoryCreateInput shape)
 * - setForm: setter (replaces useState dispatcher)
 * - errors: field-level validation errors
 * - submitting: whether an update request is in flight
 * - submitError: top-level error message (network / server)
 * - reset: clear form and errors
 * - handleSubmit: validated submit wrapper for <form onSubmit>
 */
export function useEditCategory(
  category: Category,
  onSuccess?: () => void
) {
  const [form, setForm] = useState<CategoryCreateInput>({
    name: category.name,
    slug: category.slug,
    description: category.description,
    displayOrder: category.displayOrder,
    color: category.color,
    icon: category.icon,
    isActive: category.isActive,
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { update } = useCategoryMutations();

  const reset = useCallback(() => {
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      displayOrder: category.displayOrder,
      color: category.color,
      icon: category.icon,
      isActive: category.isActive,
    });
    setErrors({});
    setSubmitError(null);
  }, [category]);

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
        // Build update payload (exclude _id, createdAt, updatedAt)
        const payload: CategoryUpdateInput = {
          name: form.name,
          description: form.description,
          displayOrder: form.displayOrder,
          color: form.color,
          icon: form.icon,
          isActive: form.isActive,
          slug: form.slug, // preserve original slug
        };

        await update(category._id, payload);
        reset();
        onSuccess?.();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to update category";
        setSubmitError(message);
      } finally {
        setSubmitting(false);
      }
    },
    [form, category._id, validate, reset, onSuccess, update]
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
