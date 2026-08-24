"use client";

import { useRef, useCallback } from "react";
import { FaUpload, FaXmark } from "react-icons/fa6";

import { AdminModal } from "../shared/AdminModal";
import { useMediaUpload } from "@/lib/hooks/useMediaUpload";
import type { MediaDocument } from "@/models/Media";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MediaUploadModalProps = {
  open: boolean;
  onClose: () => void;
  onUploaded?: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Modal for uploading images to the media library.
 *
 * Uses a hidden file input triggered by a styled button.
 * Shows loading state during upload and error messages if upload fails.
 * Automatically closes on success.
 */
export function MediaUploadModal({
  open,
  onClose,
  onUploaded,
}: MediaUploadModalProps) {
  const {
    uploading,
    uploadError,
    resetError,
    handleFileSelect,
    fileInputRef,
  } = useMediaUpload({
    onSuccess: () => {
      onClose();
      onUploaded?.();
    },
  });

  const handleModalClose = useCallback(() => {
    resetError();
    onClose();
  }, [resetError, onClose]);

  return (
    <AdminModal
      open={open}
      onClose={handleModalClose}
      title="Upload Image"
      description="Select an image to upload to your media library."
    >
      {/* Upload area */}
      <div className="space-y-4">
        {/* Drop zone / file picker */}
        <div
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 transition-colors hover:border-blue-500 hover:bg-blue-50/30"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Select image file"
          />

          <div className="mb-3 rounded-full bg-blue-100 p-3">
            <FaUpload className="text-xl text-blue-600" aria-hidden="true" />
          </div>

          <p className="text-sm font-medium text-neutral-700">
            Click to select an image
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            PNG, JPG, GIF, SVG, WEBP up to 10MB
          </p>
        </div>

        {/* Upload error */}
        {uploadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-bold text-red-700">{uploadError}</p>
            <button
              type="button"
              onClick={resetError}
              className="mt-2 text-xs font-medium text-red-600 underline hover:text-red-700"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload Image"}
        </button>
      </div>
    </AdminModal>
  );
}
