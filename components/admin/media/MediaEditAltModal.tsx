"use client";

import { useState, useCallback } from "react";

import { useMediaEdit } from "@/lib/hooks/useMediaEdit";
import type { AdminMedia } from "@/lib/types/admin-media";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MediaEditAltModalProps = {
  open: boolean;
  onClose: () => void;
  media: AdminMedia;
  onUpdated?: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Modal for editing the alt text of a media asset.
 *
 * Shows a simple form with a textarea for the alt text.
 * Validates input and shows error messages if submission fails.
 * Automatically closes on success.
 */
export function MediaEditAltModal({
  open,
  onClose,
  media,
  onUpdated,
}: MediaEditAltModalProps) {
  const {
    alt,
    setAlt,
    errors,
    submitting,
    submitError,
    handleSubmit,
    reset,
  } = useMediaEdit({
    media,
    onSuccess: () => {
      onClose();
      onUpdated?.();
    },
  });

  const [isModalOpen, setIsModalOpen] = useState(open);

  // Sync with parent open state.
  useState(() => {
    setIsModalOpen(open);
  });

  const handleModalClose = useCallback(() => {
    reset();
    setIsModalOpen(false);
    onClose();
  }, [reset, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleModalClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") handleModalClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Edit alt text"
    >
      <div className="w-full max-w-lg scale-100 transform rounded-2xl border border-neutral-200 bg-white p-8 shadow-2xl transition-all">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight text-neutral-950">
              Edit Alt Text
            </h2>
            <p className="mt-1 text-sm font-medium text-neutral-500">
              Update the alt text for accessibility.
            </p>
          </div>
          <button
            type="button"
            onClick={handleModalClose}
            className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Close modal"
          >
            <svg
              className="size-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Submit error */}
        {submitError && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-bold text-red-700">{submitError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Alt text input */}
          <div>
            <label
              htmlFor="edit-alt-text"
              className="mb-1.5 block text-sm font-medium text-neutral-700"
            >
              Alt Text
            </label>
            <textarea
              id="edit-alt-text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              rows={3}
              placeholder="Describe the image for accessibility..."
              className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                errors.alt
                  ? "border-red-500"
                  : "border-neutral-300"
              }`}
            />
            {errors.alt && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.alt}
              </p>
            )}
          </div>

          {/* Character count */}
          <p className="text-xs text-neutral-500">
            {alt.length}/200 characters
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleModalClose}
              disabled={submitting}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                className="size-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                />
              </svg>
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
