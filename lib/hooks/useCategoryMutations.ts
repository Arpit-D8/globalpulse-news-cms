"use client";

import { useState, useCallback } from "react";
import type { CategoryCreateInput, CategoryUpdateInput } from "@/lib/types/category";
import { categoryClient } from "@/lib/api/categoryClient";
import { executeMutation } from "@/lib/hooks/mutationUtils";

/**
 * Shared mutation hook for all category operations.
 *
 * Exposes:
 * - create(input) → adds a new category to the list
 * - update(id, input) → updates an existing category in the list
 * - toggle(id) → flips isActive on the category in the list
 * - delete(id) → removes the category from the list
 *
 * Each method returns { mutate, loading, error } for optimistic/pessimistic control.
 * The hook also exposes a centralized error state for UI-level feedback.
 */
export function useCategoryMutations() {
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------
  const create = useCallback(
    async (input: CategoryCreateInput) => {
      return executeMutation(
        () => categoryClient.create(input),
        setError,
        "Failed to create category"
      );
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------
  const update = useCallback(
    async (id: string, input: CategoryUpdateInput) => {
      return executeMutation(
        () => categoryClient.update(id, input),
        setError,
        "Failed to update category"
      );
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Toggle
  // ---------------------------------------------------------------------------
  const toggle = useCallback(
    async (id: string) => {
      return executeMutation(
        () => categoryClient.toggle(id),
        setError,
        "Failed to toggle category"
      );
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------
  const deleteCategory = useCallback(
    async (id: string) => {
      return executeMutation(
        () => categoryClient.delete(id),
        setError,
        "Failed to delete category"
      );
    },
    []
  );

  return {
    create,
    update,
    toggle,
    delete: deleteCategory,
    error,
    clearError,
  };
}
