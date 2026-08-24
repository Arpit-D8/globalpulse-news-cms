"use client";

import { useState, useCallback, useRef } from "react";

import type { MediaDocument } from "@/models/Media";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UseMediaUploadOptions = {
  onSuccess?: (media: MediaDocument) => void;
};

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Read a File as a base64 data URL string.
 */
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook for uploading media via POST /api/admin/media.
 *
 * Manages:
 * - File selection (via hidden input)
 * - Base64 encoding of selected file
 * - Submission loading state
 * - Submission error state
 *
 * Returns:
 * - uploading: whether a file is being uploaded
 * - uploadError: error message if upload failed
 * - resetError: clear error state
 * - handleFileSelect: callback for file input change
 * - uploadFile: programmatic upload (if you have a base64 string)
 * - fileInputRef: ref for the hidden file input
 */
export function useMediaUpload({ onSuccess }: UseMediaUploadOptions = {}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetError = useCallback(() => {
    setUploadError(null);
  }, []);

  const uploadFile = useCallback(
    async (base64Data: string) => {
      const response = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: base64Data,
          alt: "",
          createdBy: "Admin",
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error?.message || "Upload failed");
      }

      const result = await response.json();
      onSuccess?.(result.data);

      // Reset file input for next upload.
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [onSuccess]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset file input so the same file can be selected again.
      e.target.value = "";

      setUploading(true);
      setUploadError(null);

      try {
        const base64 = await readFileAsBase64(file);
        await uploadFile(base64);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to upload file";
        setUploadError(message);
      } finally {
        setUploading(false);
      }
    },
    [uploadFile]
  );

  return {
    uploading,
    uploadError,
    resetError,
    handleFileSelect,
    uploadFile,
    fileInputRef,
  };
}
