"use client";

import { useEffect, useState, useCallback } from "react";
import type { Author, AuthorCreateInput, AuthorUpdateInput } from "@/lib/types/author";
import { authorClient } from "@/lib/api/authorClient";
import { executeMutation } from "@/lib/hooks/mutationUtils";

/**
 * Shared hook for fetching and managing the author list.
 *
 * Exposes:
 * - authors: the current list
 * - loading: whether a fetch is in progress
 * - error: error message if the fetch failed
 * - refresh(): force refetch
 * - createAuthor(input): create a new author
 * - updateAuthor(id, input): update an existing author
 * - deleteAuthor(id): soft-delete an author
 * - toggleAuthorStatus(id): flip isActive on an author
 */
export function useAuthors() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await authorClient.getAuthors();
        if (!cancelled) {
          setAuthors(data);
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

  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------

  const createAuthor = useCallback(
    async (input: AuthorCreateInput) => {
      const author = await executeMutation(
        () => authorClient.createAuthor(input),
        setError,
        "Failed to create author"
      );
      setAuthors((prev) => [...prev, author]);
      return author;
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------

  const updateAuthor = useCallback(
    async (id: string, input: AuthorUpdateInput) => {
      const author = await executeMutation(
        () => authorClient.updateAuthor(id, input),
        setError,
        "Failed to update author"
      );
      setAuthors((prev) =>
        prev.map((a) => (a._id === id ? { ...a, ...author } : a))
      );
      return author;
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  const deleteAuthor = useCallback(
    async (id: string) => {
      const author = await executeMutation(
        () => authorClient.deleteAuthor(id),
        setError,
        "Failed to delete author"
      );
      setAuthors((prev) => prev.filter((a) => a._id !== id));
      return author;
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Toggle
  // ---------------------------------------------------------------------------

  const toggleAuthorStatus = useCallback(
    async (id: string) => {
      const author = await executeMutation(
        () => authorClient.toggleAuthorStatus(id),
        setError,
        "Failed to toggle author"
      );
      setAuthors((prev) =>
        prev.map((a) => (a._id === id ? { ...a, ...author } : a))
      );
      return author;
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Optimistic helpers — mutate local state directly without refetching
  // ---------------------------------------------------------------------------

  const updateLocalAuthor = useCallback(
    (id: string, updates: Partial<Author>) => {
      setAuthors((prev) =>
        prev.map((a) => (a._id === id ? { ...a, ...updates } : a))
      );
    },
    []
  );

  const removeAuthor = useCallback((id: string) => {
    setAuthors((prev) => prev.filter((a) => a._id !== id));
  }, []);

  const refresh = useCallback(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await authorClient.getAuthors();
        if (!cancelled) {
          setAuthors(data);
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
    authors,
    loading,
    error,
    refresh,
    createAuthor,
    updateAuthor,
    deleteAuthor,
    toggleAuthorStatus,
    updateLocalAuthor,
    removeAuthor,
  };
}
