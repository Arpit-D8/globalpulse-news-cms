"use client";

import type { CategoryCreateInput } from "@/lib/types/category";

type CategoryFormProps = {
  form: CategoryCreateInput;
  setForm: (form: CategoryCreateInput) => void;
  errors: Partial<Record<keyof CategoryCreateInput, string>>;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  isEdit?: boolean;
};

export function CategoryForm({
  form,
  setForm,
  errors,
  submitting,
  onSubmit,
  isEdit,
}: CategoryFormProps) {
  const updateField = <K extends keyof CategoryCreateInput>(
    key: K,
    value: CategoryCreateInput[K]
  ) => {
    setForm({ ...form, [key]: value });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {/* Name */}
      <div>
        <label
          htmlFor="category-name"
          className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-neutral-600"
        >
          Name <span className="text-red-600">*</span>
        </label>
        <input
          id="category-name"
          type="text"
          placeholder="e.g. Politics"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 ${
            errors.name
              ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500/20"
              : "border-neutral-300 bg-white focus:border-red-700 focus:ring-red-700/20"
          }`}
          autoFocus
          maxLength={50}
        />
        {errors.name && (
          <p className="mt-1.5 text-xs font-bold text-red-600">{errors.name}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="category-description"
          className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-neutral-600"
        >
          Description
        </label>
        <textarea
          id="category-description"
          placeholder="Brief description…"
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          rows={3}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 ${
            errors.description
              ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500/20"
              : "border-neutral-300 bg-white focus:border-red-700 focus:ring-red-700/20"
          }`}
          maxLength={500}
        />
        <div className="mt-1.5 flex items-center justify-between">
          {errors.description ? (
            <p className="text-xs font-bold text-red-600">
              {errors.description}
            </p>
          ) : (
            <span />
          )}
          <span className="text-xs text-neutral-400">
            {form.description.length}/500
          </span>
        </div>
      </div>

      {/* Display Order */}
      <div>
        <label
          htmlFor="category-order"
          className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-neutral-600"
        >
          Display Order
        </label>
        <input
          id="category-order"
          type="number"
          min={0}
          value={form.displayOrder}
          onChange={(e) =>
            updateField("displayOrder", Math.max(0, parseInt(e.target.value, 10) || 0))
          }
          className={`w-full rounded-lg border px-3 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 ${
            errors.displayOrder
              ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500/20"
              : "border-neutral-300 bg-white focus:border-red-700 focus:ring-red-700/20"
          }`}
        />
        {errors.displayOrder && (
          <p className="mt-1.5 text-xs font-bold text-red-600">
            {errors.displayOrder}
          </p>
        )}
      </div>

      {/* Color */}
      <div>
        <label
          htmlFor="category-color"
          className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-neutral-600"
        >
          Color
        </label>
        <div className="flex items-center gap-3">
          <input
            id="category-color"
            type="color"
            value={form.color}
            onChange={(e) => updateField("color", e.target.value)}
            className="size-10 cursor-pointer rounded-lg border border-neutral-300 bg-white"
          />
          <input
            type="text"
            value={form.color}
            onChange={(e) => updateField("color", e.target.value)}
            className="w-24 rounded-lg border border-neutral-300 px-3 py-2.5 text-sm font-mono font-semibold transition focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-700/20"
            maxLength={20}
          />
        </div>
      </div>

      {/* Icon */}
      <div>
        <label
          htmlFor="category-icon"
          className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-neutral-600"
        >
          Icon
        </label>
        <input
          id="category-icon"
          type="text"
          placeholder="Icon name (optional)"
          value={form.icon}
          onChange={(e) => updateField("icon", e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm font-semibold transition focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-700/20"
          maxLength={50}
        />
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <input
          id="category-active"
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => updateField("isActive", e.target.checked)}
          className="size-4 rounded border-neutral-300 text-red-700 focus:ring-red-700"
        />
        <label
          htmlFor="category-active"
          className="text-sm font-bold text-neutral-700"
        >
          Active
        </label>
      </div>

      {/* Submit button */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-6 py-2.5 text-sm font-black uppercase text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <>
              <svg
                className="size-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              {isEdit ? "Updating…" : "Creating…"}
            </>
          ) : isEdit ? (
            "Update Category"
          ) : (
            "Create Category"
          )}
        </button>
      </div>
    </form>
  );
}
