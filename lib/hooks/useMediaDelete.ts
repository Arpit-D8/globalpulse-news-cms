"use client";

import { useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook for deleting media via DELETE /api/admin/media/[id].
 *
 * Manages:
 * - Confirmation state (whether user has confirmed deletion)
 * - Deletion loading state
 * - Deletion error state
 *
 * Returns:
 * - deleting: whether a deletion request is in flight
 * - deleteError: error message if deletion failed
 * - resetError: clear error state
 * - confirmDelete: returns true if deletion should proceed
 * - executeDelete: performs the actual deletion request
 */
export function useMediaDelete({
  mediaId,
  onSuccess,
}: {
  mediaId: string;
  onSuccess?: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const resetError = useCallback(() => {
    setDeleteError(null);
  }, []);

  const confirmDelete = useCallback((): boolean => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this media? This action cannot be undone."
    );
    return confirmed;
  }, []);

  const executeDelete = useCallback(async () => {
    setDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/admin/media/${mediaId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error?.message || "Failed to delete media");
      }

      onSuccess?.();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete media";
      setDeleteError(message);
    } finally {
      setDeleting(false);
    }
  }, [mediaId, onSuccess]);

  return {
    deleting,
    deleteError,
    resetError,
    confirmDelete,
    executeDelete,
  };
}
