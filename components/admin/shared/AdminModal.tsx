"use client";

import { type ReactNode } from "react";

type AdminModalProps = {
  /** Whether the modal is currently visible. */
  open: boolean;
  /** Called when the modal should close (backdrop click, escape, or close button). */
  onClose: () => void;
  /** Title displayed in the modal header. */
  title: string;
  /** Optional subtitle displayed below the title. */
  description?: string;
  /** Label for the close button (defaults to "Close modal"). */
  closeLabel?: string;
  /** The modal content (form, table, etc.). */
  children: ReactNode;
  /** ARIA label for the dialog (defaults to the title). */
  ariaLabel?: string;
};

/**
 * Shared modal wrapper for admin create/edit forms.
 *
 * Provides:
 * - Fixed overlay with semi-transparent backdrop
 * - Click-outside to dismiss
 * - Escape key to dismiss
 * - Accessible dialog role and aria attributes
 * - Consistent header with title, description, and close button
 * - Consistent card styling (rounded corners, shadow, border)
 *
 * Used by all admin CRUD pages to avoid duplicating modal boilerplate.
 */
export function AdminModal({
  open,
  onClose,
  title,
  description,
  closeLabel = "Close modal",
  children,
  ariaLabel,
}: AdminModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel ?? title}
    >
      <div className="w-full max-w-lg scale-100 transform rounded-2xl border border-neutral-200 bg-white p-8 shadow-2xl transition-all">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-black tracking-tight text-neutral-950">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm font-medium text-neutral-500">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
            aria-label={closeLabel}
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

        {/* Body */}
        <div>{children}</div>
      </div>
    </div>
  );
}
