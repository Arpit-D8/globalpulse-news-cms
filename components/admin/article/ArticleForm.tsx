"use client";

import { type ChangeEvent, useCallback, useRef, useState } from "react";
import Image from "next/image";

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { ArticleEditor } from "./ArticleEditor";
import { MediaPickerModal } from "./MediaPickerModal";
import { TagSelector } from "./TagSelector";
import type { AdminMedia } from "@/lib/types/admin-media";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Form field values for the article create/edit form.
 *
 * All fields are strings or booleans — this type carries no Mongoose
 * document shape or ObjectId references. The parent component resolves
 * authorId / categoryId / featuredImageId to the actual ObjectId strings
 * before submitting to the API.
 */
export type ArticleFormValues = {
  /** Article headline. */
  title: string;
  /** URL-friendly slug (auto-generated from title in the parent). */
  slug: string;
  /** Short excerpt displayed in listing cards. */
  summary: string;
  /** Full article body (populated by the rich-text editor in the parent). */
  content: string;
  /** Author ObjectId string. */
  authorId: string;
  /** Category ObjectId string. */
  categoryId: string;
  /** Featured image ObjectId string. */
  featuredImageId: string;
  /** Free-form tag strings. */
  tags: string[];
  /** Optional override for the HTML <title> tag. */
  seoTitle: string;
  /** Optional override for the meta description. */
  seoDescription: string;
  /** Optional canonical URL for SEO. */
  canonicalUrl: string;
  /** Whether the article is featured on the homepage. */
  isFeatured: boolean;
  /** Publication lifecycle state. */
  status: "draft" | "published" | "archived";
};

/**
 * Minimal author option rendered in a <select> dropdown.
 */
export type AuthorOption = {
  _id: string;
  name: string;
};

/**
 * Minimal category option rendered in a <select> dropdown.
 */
export type CategoryOption = {
  _id: string;
  name: string;
};

/**
 * Validation error map keyed by form field name.
 */
type ArticleFormErrors = Partial<Record<keyof ArticleFormValues, string>>;

/**
 * Props for the presentational article form.
 *
 * This component knows nothing about Create vs Edit — it simply renders the
 * UI and exposes callbacks. The parent component is responsible for:
 * - Populating `values` from API data (edit) or defaults (create)
 * - Fetching `authors` and `categories` from the API
 * - Calling `onSubmit` to perform the actual save
 * - Collecting field-level errors and passing them via `errors`
 */
export type ArticleFormProps = {
  /** Current form field values. */
  values: ArticleFormValues;
  /** Available authors for the author <select>. */
  authors: AuthorOption[];
  /** Available categories for the category <select>. */
  categories: CategoryOption[];

  /** Optional preview URL for the featured image (populated Media.url). */
  featuredImageUrl?: string;

  /** Whether the form is currently saving (disables the Save button). */
  loading?: boolean;
  /** Optional field-level validation errors. */
  errors?: ArticleFormErrors;

  /**
   * Called when the user clicks the "🪄 Generate with AI" button.
   * Only provided on the create/new article page.
   */
  onGenerateWithAI?: () => void;
  /** Whether AI generation is in progress (disables the AI button). */
  isGenerating?: boolean;

  /**
   * Called when a field value changes.
   *
   * @param field   — The field to update.
   * @param value   — The new value (string, boolean, or string[]).
   */
  onChange: (
    field: keyof ArticleFormValues,
    value: string | boolean | string[]
  ) => void;

  /** Called when the user clicks the Save Article button. */
  onSubmit: () => void;

  /** Optional callback when the user clicks Cancel. */
  onCancel?: () => void;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: { value: ArticleFormValues["status"]; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Presentational article create/edit form.
 *
 * Renders a large responsive card containing all article fields:
 * title, slug, summary, content placeholder, featured image placeholder,
 * author, category, tags, SEO fields, and publishing options.
 *
 * This component is completely stateless with respect to data fetching and
 * business logic. It receives all data via props and exposes callbacks for
 * changes and submission.
 *
 * Features:
 * - Controlled inputs driven entirely by `values` prop
 * - Field-level error display via `errors` prop
 * - Disabled Save button when `loading` is true
 * - Every input has an associated <label> for accessibility
 * - Buttons use type="button" except Save which uses type="submit"
 * - Tailwind-only styling consistent with the admin media library
 */
export function ArticleForm({
  values,
  authors,
  categories,
  featuredImageUrl,
  loading = false,
  errors = {},
  onGenerateWithAI,
  isGenerating = false,
  onChange,
  onSubmit,
  onCancel,
}: ArticleFormProps) {
  // -----------------------------------------------------------------------
  // State
  // -----------------------------------------------------------------------

  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Local preview URL for the featured image (populated from Media.url). */
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);

  /** Computed preview: local selection takes priority over the prop. */
  const previewUrl = localImageUrl ?? featuredImageUrl;

  // -----------------------------------------------------------------------
  // Event handlers
  // -----------------------------------------------------------------------

  /**
   * Handle change for string and boolean fields.
   *
   * Extracts the field name and value from a native DOM event and forwards
   * it to the parent via `onChange`.
   */
  const handleChange = useCallback(
    (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      const { name, value, type } = e.target;

      if (type === "checkbox" && e.target instanceof HTMLInputElement) {
        onChange(name as keyof ArticleFormValues, e.target.checked);
      } else {
        onChange(name as keyof ArticleFormValues, value);
      }
    },
    [onChange]
  );

  /**
   * Handle featured image selection from the media picker modal.
   */
  const handleImageSelect = useCallback(
    (media: AdminMedia) => {
      onChange("featuredImageId", media._id);
      setLocalImageUrl(media.url);
    },
    [onChange]
  );

  /**
   * Handle removing the featured image.
   */
  const handleRemoveImage = useCallback(() => {
    onChange("featuredImageId", "");
    setLocalImageUrl(null);
  }, [onChange]);

  /**
   * Handle direct file upload via hidden file input.
   *
   * Reads the selected file as base64, uploads it via POST /api/admin/media,
   * and selects the returned media asset as the featured image.
   */
  const handleFileUpload = useCallback(
    async (file: File) => {
      setUploadError(null);

      // Validate file type.
      if (!file.type.startsWith("image/")) {
        setUploadError(
          "Please select an image file (JPEG, PNG, WebP, GIF, or SVG)."
        );
        return;
      }

      // Validate file size (10 MB max).
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setUploadError("File size must be less than 10 MB.");
        return;
      }

      setUploadingImage(true);

      try {
        // Read as base64 data URL.
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Upload via the admin media API.
        const response = await fetch("/api/admin/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: base64,
            alt: values.title || "Article image",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData?.error?.message || "Upload failed"
          );
        }

        const result = await response.json();

        // Debug logging for upload troubleshooting.
        console.log("[Upload Response]", result);
        console.log("[Upload Response OK]", response.ok, "Status:", response.status);

        if (!result.success || !result.data) {
          throw new Error("Invalid response from server");
        }

        // Select the uploaded media as the featured image.
        handleImageSelect(result.data);
      } catch (error) {
        console.error("[Image Upload Error]", error);
        setUploadError(
          error instanceof Error
            ? error.message
            : "Failed to upload image. Please try again."
        );
      } finally {
        setUploadingImage(false);
      }
    },
    [values.title, handleImageSelect]
  );

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      {/* ---- Title & Slug ---- */}
      <div className="space-y-4">
        <div>
          <label htmlFor="article-title" className="cms-label">
            Title
          </label>
          <input
            id="article-title"
            name="title"
            type="text"
            value={values.title}
            onChange={handleChange}
            required
            placeholder="Enter article headline"
            className={`cms-input text-2xl font-black ${errors.title ? "border-red-500 ring-2 ring-red-500/20" : ""}`}
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? "article-title-error" : undefined}
          />
          {errors.title && (
            <p id="article-title-error" className="mt-1 text-xs font-medium text-red-600">
              {errors.title}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="article-slug" className="cms-label">
            Slug
          </label>
          <input
            id="article-slug"
            name="slug"
            type="text"
            value={values.slug}
            onChange={handleChange}
            required
            placeholder="url-friendly-slug"
            className={`cms-input lowercase ${errors.slug ? "border-red-500 ring-2 ring-red-500/20" : ""}`}
            aria-invalid={!!errors.slug}
            aria-describedby={errors.slug ? "article-slug-error" : undefined}
          />
          {errors.slug && (
            <p id="article-slug-error" className="mt-1 text-xs font-medium text-red-600">
              {errors.slug}
            </p>
          )}
        </div>
      </div>

      {/* ---- Summary ---- */}
      <div>
        <label htmlFor="article-summary" className="cms-label">
          Summary
        </label>
        <textarea
          id="article-summary"
          name="summary"
          value={values.summary}
          onChange={handleChange}
          required
          rows={3}
          placeholder="Brief excerpt displayed in listing cards"
          className={`cms-input resize-y ${errors.summary ? "border-red-500 ring-2 ring-red-500/20" : ""}`}
          aria-invalid={!!errors.summary}
          aria-describedby={errors.summary ? "article-summary-error" : undefined}
        />
        {errors.summary && (
          <p id="article-summary-error" className="mt-1 text-xs font-medium text-red-600">
            {errors.summary}
          </p>
        )}
      </div>

      {/* ---- Content Editor ---- */}
      <div>
        <label htmlFor="article-content" className="cms-label">
          Content
        </label>
        <ArticleEditor
          value={values.content}
          onChange={(html) => onChange("content", html)}
          placeholder="Start writing your article..."
        />
        {errors.content && (
          <p className="mt-1 text-xs font-medium text-red-600">
            {errors.content}
          </p>
        )}
      </div>

      {/* ---- Featured Image ---- */}
      <div>
        <span className="cms-label">Featured Image</span>
        <div className="mt-2">
          {values.featuredImageId && previewUrl ? (
            <div className="relative inline-block">
              <div className="h-[225px] w-[400px] overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                <Image
                  src={previewUrl}
                  alt="Featured image preview"
                  width={400}
                  height={225}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </div>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black/80"
                aria-label="Remove image"
              >
                <svg className="size-4" aria-hidden="true" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-3">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                    // Reset input so the same file can be selected again.
                    e.target.value = "";
                  }
                }}
              />

              {/* Media library picker button */}
              <button
                type="button"
                onClick={() => setMediaPickerOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Choose Image
              </button>

              {/* Direct upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploadingImage ? (
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
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  "Upload Image"
                )}
              </button>

              {/* Inline upload error */}
              {uploadError && (
                <p className="text-xs font-medium text-red-600">
                  {uploadError}
                </p>
              )}
            </div>
          )}
          {errors.featuredImageId && (
            <p className="mt-1 text-xs font-medium text-red-600">
              {errors.featuredImageId}
            </p>
          )}
        </div>
      </div>

      {/* ---- Author & Category ---- */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="article-author" className="cms-label">
            Author
          </label>
          <select
            id="article-author"
            name="authorId"
            value={values.authorId}
            onChange={handleChange}
            className={`cms-input ${errors.authorId ? "border-red-500 ring-2 ring-red-500/20" : ""}`}
            aria-invalid={!!errors.authorId}
            aria-describedby={errors.authorId ? "article-author-error" : undefined}
          >
            <option value="">Select an author</option>
            {authors.map((author) => (
              <option key={author._id} value={author._id}>
                {author.name}
              </option>
            ))}
          </select>
          {errors.authorId && (
            <p id="article-author-error" className="mt-1 text-xs font-medium text-red-600">
              {errors.authorId}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="article-category" className="cms-label">
            Category
          </label>
          <select
            id="article-category"
            name="categoryId"
            value={values.categoryId}
            onChange={handleChange}
            className={`cms-input ${errors.categoryId ? "border-red-500 ring-2 ring-red-500/20" : ""}`}
            aria-invalid={!!errors.categoryId}
            aria-describedby={errors.categoryId ? "article-category-error" : undefined}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p id="article-category-error" className="mt-1 text-xs font-medium text-red-600">
              {errors.categoryId}
            </p>
          )}
        </div>
      </div>

      {/* ---- Tags ---- */}
      <div>
        <p className="cms-label">Tags</p>
        <TagSelector
          value={values.tags}
          onChange={(tagIds) => onChange("tags", tagIds)}
          error={errors.tags}
        />
      </div>

      {/* ---- SEO Section ---- */}
      <div className="space-y-4 rounded-lg border border-neutral-200 bg-neutral-50 p-5">
        <h3 className="text-sm font-bold text-neutral-800">SEO Settings</h3>

        <div>
          <label htmlFor="article-seo-title" className="cms-label">
            SEO Title
          </label>
          <input
            id="article-seo-title"
            name="seoTitle"
            type="text"
            value={values.seoTitle}
            onChange={handleChange}
            placeholder="Override the HTML &lt;title&gt; tag"
            className="cms-input"
          />
          {errors.seoTitle && (
            <p className="mt-1 text-xs font-medium text-red-600">
              {errors.seoTitle}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="article-seo-description" className="cms-label">
            SEO Description
          </label>
          <textarea
            id="article-seo-description"
            name="seoDescription"
            value={values.seoDescription}
            onChange={handleChange}
            rows={2}
            placeholder="Override the meta description"
            className="cms-input resize-y"
          />
          {errors.seoDescription && (
            <p className="mt-1 text-xs font-medium text-red-600">
              {errors.seoDescription}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="article-canonical-url" className="cms-label">
            Canonical URL
          </label>
          <input
            id="article-canonical-url"
            name="canonicalUrl"
            type="text"
            value={values.canonicalUrl}
            onChange={handleChange}
            placeholder="https://example.com/article-slug"
            className="cms-input"
          />
          {errors.canonicalUrl && (
            <p className="mt-1 text-xs font-medium text-red-600">
              {errors.canonicalUrl}
            </p>
          )}
        </div>
      </div>

      {/* ---- Publishing Section ---- */}
      <div className="space-y-4 rounded-lg border border-neutral-200 bg-neutral-50 p-5">
        <h3 className="text-sm font-bold text-neutral-800">Publishing</h3>

        <label className="flex items-center gap-3 text-sm font-medium text-neutral-700">
          <input
            type="checkbox"
            name="isFeatured"
            checked={values.isFeatured}
            onChange={handleChange}
            className="size-4 accent-blue-600"
          />
          Featured on homepage
        </label>

        <div>
          <label htmlFor="article-status" className="cms-label">
            Status
          </label>
          <select
            id="article-status"
            name="status"
            value={values.status}
            onChange={handleChange}
            className="cms-input"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ---- Actions ---- */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
          >
            Cancel
          </button>
        )}
        {onGenerateWithAI && (
          <button
            type="button"
            onClick={onGenerateWithAI}
            disabled={isGenerating}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? "Generating..." : "🪄 Generate with AI"}
          </button>
        )}
        <button
          type="submit"
          onClick={onSubmit}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save Article
        </button>
      </div>

      {/* Media Picker Modal */}
      {mediaPickerOpen && (
        <MediaPickerModal
          open={mediaPickerOpen}
          onClose={() => setMediaPickerOpen(false)}
          onSelect={handleImageSelect}
        />
      )}
    </form>
  );
}
