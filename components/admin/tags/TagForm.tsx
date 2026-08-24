"use client";

import type { AdminTag } from "@/lib/types/admin-tag";

type TagFormValues = {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
};

type TagFormProps = {
  form: AdminTag;
  setForm: (form: AdminTag) => void;
  errors: Partial<Record<keyof TagFormValues, string>>;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  isEdit?: boolean;
};

export function TagForm({
  form,
  setForm,
  errors,
  submitting,
  onSubmit,
  isEdit,
}: TagFormProps) {
  const updateField = <K extends keyof TagFormValues>(
    key: K,
    value: TagFormValues[K]
  ) => {
    setForm({ ...form, [key]: value });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {/* Name */}
      <div>
        <label
          htmlFor="tag-name"
          className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-neutral-600"
        >
          Name <span className="text-red-600">*</span>
        </label>
        <input
          id="tag-name"
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
          maxLength={80}
        />
        {errors.name && (
          <p className="mt-1.5 text-xs font-bold text-red-600">{errors.name}</p>
        )}
      </div>

      {/* Slug */}
      <div>
        <label
          htmlFor="tag-slug"
          className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-neutral-600"
        >
          Slug
        </label>
        <input
          id="tag-slug"
          type="text"
          placeholder="url-friendly-slug"
          value={form.slug}
          onChange={(e) => updateField("slug", e.target.value)}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm font-mono font-semibold transition focus:outline-none focus:ring-2 ${
            errors.slug
              ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500/20"
              : "border-neutral-300 bg-white focus:border-red-700 focus:ring-red-700/20"
          }`}
          maxLength={200}
        />
        {errors.slug && (
          <p className="mt-1.5 text-xs font-bold text-red-600">{errors.slug}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="tag-description"
          className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-neutral-600"
        >
          Description
        </label>
        <textarea
          id="tag-description"
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

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <input
          id="tag-active"
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => updateField("isActive", e.target.checked)}
          className="size-4 rounded border-neutral-300 text-red-700 focus:ring-red-700"
        />
        <label
          htmlFor="tag-active"
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
            "Update Tag"
          ) : (
            "Create Tag"
          )}
        </button>
      </div>
    </form>
  );
}
