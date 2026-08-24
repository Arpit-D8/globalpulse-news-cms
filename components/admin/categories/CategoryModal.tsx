"use client";

import { CategoryForm } from "./CategoryForm";
import { useCreateCategory } from "@/lib/hooks/useCreateCategory";
import { useEditCategory } from "@/lib/hooks/useEditCategory";
import type { Category } from "@/lib/types/category";

type CategoryModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  onUpdated?: () => void;
  category?: Category;
};

export function CategoryModal({
  open,
  onClose,
  onCreated,
  onUpdated,
  category,
}: CategoryModalProps) {
  const isEdit = !!category;

  // Use the appropriate hook based on mode
  const {
    form,
    setForm,
    errors,
    submitting,
    submitError,
    handleSubmit,
    reset,
  } = isEdit
    ? useEditCategory(category, () => {
        onClose();
        onUpdated?.();
      })
    : useCreateCategory(() => {
        onClose();
        onCreated?.();
      });

  // Reset form when modal closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleOpenChange(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") handleOpenChange(false);
      }}
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? "Edit Category" : "Create Category"}
    >
      <div className="w-full max-w-lg scale-100 transform rounded-2xl border border-neutral-200 bg-white p-8 shadow-2xl transition-all">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight text-neutral-950">
              {isEdit ? "Edit Category" : "New Category"}
            </h2>
            <p className="mt-1 text-sm font-medium text-neutral-500">
              {isEdit
                ? `Update the "${category!.name}" category.`
                : "Add a category to organize your content."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
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
        <CategoryForm
          form={form}
          setForm={setForm}
          errors={errors}
          submitting={submitting}
          onSubmit={handleSubmit}
          isEdit={isEdit}
        />
      </div>
    </div>
  );
}
