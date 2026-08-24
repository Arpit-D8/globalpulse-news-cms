"use client";

import type { AuthorCreateInput } from "@/lib/types/author";

type AuthorFormProps = {
  form: AuthorCreateInput;
  setForm: (form: AuthorCreateInput) => void;
  errors: Partial<Record<keyof AuthorCreateInput, string>>;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  isEdit?: boolean;
};

export function AuthorForm({
  form,
  setForm,
  errors,
  submitting,
  onSubmit,
  isEdit,
}: AuthorFormProps) {
  const updateField = <K extends keyof AuthorCreateInput>(
    key: K,
    value: AuthorCreateInput[K]
  ) => {
    setForm({ ...form, [key]: value });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {/* Name */}
      <div>
        <label
          htmlFor="author-name"
          className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-neutral-600"
        >
          Name <span className="text-red-600">*</span>
        </label>
        <input
          id="author-name"
          type="text"
          placeholder="e.g. Jane Doe"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 ${
            errors.name
              ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500/20"
              : "border-neutral-300 bg-white focus:border-red-700 focus:ring-red-700/20"
          }`}
          autoFocus
          maxLength={100}
        />
        {errors.name && (
          <p className="mt-1.5 text-xs font-bold text-red-600">{errors.name}</p>
        )}
      </div>

      {/* Bio */}
      <div>
        <label
          htmlFor="author-bio"
          className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-neutral-600"
        >
          Bio
        </label>
        <textarea
          id="author-bio"
          placeholder="Brief biography…"
          value={form.bio}
          onChange={(e) => updateField("bio", e.target.value)}
          rows={4}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 ${
            errors.bio
              ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500/20"
              : "border-neutral-300 bg-white focus:border-red-700 focus:ring-red-700/20"
          }`}
          maxLength={1000}
        />
        <div className="mt-1.5 flex items-center justify-between">
          {errors.bio ? (
            <p className="text-xs font-bold text-red-600">{errors.bio}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-neutral-400">
            {form.bio.length}/1000
          </span>
        </div>
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="author-email"
          className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-neutral-600"
        >
          Email
        </label>
        <input
          id="author-email"
          type="email"
          placeholder="e.g. jane@example.com"
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 ${
            errors.email
              ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500/20"
              : "border-neutral-300 bg-white focus:border-red-700 focus:ring-red-700/20"
          }`}
          maxLength={255}
        />
        {errors.email && (
          <p className="mt-1.5 text-xs font-bold text-red-600">{errors.email}</p>
        )}
      </div>

      {/* Photo URL */}
      <div>
        <label
          htmlFor="author-photoUrl"
          className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-neutral-600"
        >
          Photo URL
        </label>
        <input
          id="author-photoUrl"
          type="url"
          placeholder="e.g. https://example.com/photo.jpg"
          value={form.photoUrl}
          onChange={(e) => updateField("photoUrl", e.target.value)}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 ${
            errors.photoUrl
              ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500/20"
              : "border-neutral-300 bg-white focus:border-red-700 focus:ring-red-700/20"
          }`}
          maxLength={500}
        />
        {errors.photoUrl && (
          <p className="mt-1.5 text-xs font-bold text-red-600">{errors.photoUrl}</p>
        )}
      </div>

      {/* Website URL */}
      <div>
        <label
          htmlFor="author-websiteUrl"
          className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-neutral-600"
        >
          Website URL
        </label>
        <input
          id="author-websiteUrl"
          type="url"
          placeholder="e.g. https://example.com"
          value={form.websiteUrl}
          onChange={(e) => updateField("websiteUrl", e.target.value)}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 ${
            errors.websiteUrl
              ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500/20"
              : "border-neutral-300 bg-white focus:border-red-700 focus:ring-red-700/20"
          }`}
          maxLength={500}
        />
        {errors.websiteUrl && (
          <p className="mt-1.5 text-xs font-bold text-red-600">{errors.websiteUrl}</p>
        )}
      </div>

      {/* Twitter Handle */}
      <div>
        <label
          htmlFor="author-twitterHandle"
          className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-neutral-600"
        >
          Twitter Handle
        </label>
        <input
          id="author-twitterHandle"
          type="text"
          placeholder="e.g. @janedoe"
          value={form.twitterHandle}
          onChange={(e) => updateField("twitterHandle", e.target.value)}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 ${
            errors.twitterHandle
              ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500/20"
              : "border-neutral-300 bg-white focus:border-red-700 focus:ring-red-700/20"
          }`}
          maxLength={50}
        />
        {errors.twitterHandle && (
          <p className="mt-1.5 text-xs font-bold text-red-600">{errors.twitterHandle}</p>
        )}
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <input
          id="author-active"
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => updateField("isActive", e.target.checked)}
          className="size-4 rounded border-neutral-300 text-red-700 focus:ring-red-700"
        />
        <label
          htmlFor="author-active"
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
            "Update Author"
          ) : (
            "Create Author"
          )}
        </button>
      </div>
    </form>
  );
}
