"use client";

import { useEffect, useState, useCallback } from "react";
import type { Category } from "@/lib/types/category";
import { categoryClient } from "@/lib/api/categoryClient";

/**
 * Shared hook for fetching and managing the category list.
 *
 * Exposes:
 * - categories: the current list
 * - loading: whether a fetch is in progress
 * - error: error message if the fetch failed
 * - searchQuery: current search string (client-side filter)
 * - setSearchQuery: setter for search string
 * - refresh: force refetch
 */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await categoryClient.list();
        if (!cancelled) {
          setCategories(data);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Unknown error";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // Client-side filtered list
  const filteredCategories = categories.filter((cat) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cat.name.toLowerCase().includes(q) ||
      cat.description.toLowerCase().includes(q) ||
      cat.slug.toLowerCase().includes(q)
    );
  });

  // ---------------------------------------------------------------------------
  // Optimistic helpers — mutate local state directly without refetching
  // ---------------------------------------------------------------------------

  const updateLocalCategory = useCallback(
    (id: string, updates: Partial<Category>) => {
      setCategories((prev) =>
        prev.map((cat) => (cat._id === id ? { ...cat, ...updates } : cat))
      );
    },
    []
  );

  const removeCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((cat) => cat._id !== id));
  }, []);

  const refresh = useCallback(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await categoryClient.list();
        if (!cancelled) {
          setCategories(data);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Unknown error";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    categories: filteredCategories,
    allCategories: categories,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    refresh,
    updateLocalCategory,
    removeCategory,
  };
}
