"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArticleForm, type ArticleFormValues, type AuthorOption, type CategoryOption } from "@/components/admin/article/ArticleForm";
import { generateSlug } from "@/lib/slug";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PageState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready" };

type ApiError = {
  message: string;
  details?: Record<string, string>;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMPTY_FORM: ArticleFormValues = {
  title: "",
  slug: "",
  summary: "",
  content: "",
  authorId: "",
  categoryId: "",
  featuredImageId: "",
  tags: [],
  seoTitle: "",
  seoDescription: "",
  canonicalUrl: "",
  isFeatured: false,
  status: "draft",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NewArticlePage() {
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>({ status: "loading" });
  const [values, setValues] = useState<ArticleFormValues>(EMPTY_FORM);
  const [authors, setAuthors] = useState<AuthorOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [errors, setErrors] = useState<Record<keyof ArticleFormValues, string | undefined>>({
    title: undefined,
    slug: undefined,
    summary: undefined,
    content: undefined,
    authorId: undefined,
    categoryId: undefined,
    featuredImageId: undefined,
    tags: undefined,
    seoTitle: undefined,
    seoDescription: undefined,
    canonicalUrl: undefined,
    isFeatured: undefined,
    status: undefined,
  });
  const [saving, setSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | undefined>(undefined);
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | undefined>(undefined);

  // ---------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const [authorsRes, categoriesRes] = await Promise.all([
          fetch("/api/admin/authors"),
          fetch("/api/admin/categories"),
        ]);

        if (!authorsRes.ok || !categoriesRes.ok) {
          throw new Error("Failed to load authors or categories");
        }

        const authorsData = (await authorsRes.json()) as { success: boolean; data: { authors: AuthorOption[]; pagination: unknown } };
        const categoriesData = (await categoriesRes.json()) as { success: boolean; data: { categories: CategoryOption[]; pagination: unknown } };

        if (!cancelled) {
          setAuthors(authorsData.data.authors.map(a => ({ _id: a._id, name: a.name })));
          setCategories(categoriesData.data.categories.map(c => ({ _id: c._id, name: c.name })));
          setPageState({ status: "ready" });
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load data";
          setPageState({ status: "error", message });
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------------------------------------------------------------------
  // Auto-generate slug from title
  // ---------------------------------------------------------------------

  /**
   * Tracks whether the user has manually edited the slug field.
   * When false (default), title changes auto-update the slug.
   * When true (user typed in slug), title changes are ignored.
   */
  const slugManuallyEdited = useRef(false);

  /**
   * Auto-generate the slug whenever the title changes, but only
   * if the user hasn't already typed a custom slug.
   */
  useEffect(() => {
    if (!slugManuallyEdited.current) {
      setValues((prev) => ({ ...prev, slug: generateSlug(prev.title) }));
    }
  }, [values.title]);

  // ---------------------------------------------------------------------
  // Form handlers
  // ---------------------------------------------------------------------

  const handleChange = useCallback(
    (field: keyof ArticleFormValues, value: string | boolean | string[]) => {
      // Mark slug as manually edited when the user types in the slug field.
      if (field === "slug") {
        slugManuallyEdited.current = true;
      }

      // When featuredImageId changes, clear the preview URL (no lookup needed;
      // the admin will select from media picker which sets the URL directly).
      if (field === "featuredImageId") {
        setFeaturedImageUrl(undefined);
      }

      setValues((prev) => ({ ...prev, [field]: value }));
      // Clear field error on change.
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    // Validate required fields.
    const fieldErrors: Record<keyof ArticleFormValues, string | undefined> = {
      title: undefined,
      slug: undefined,
      summary: undefined,
      content: undefined,
      authorId: undefined,
      categoryId: undefined,
      featuredImageId: undefined,
      tags: undefined,
      seoTitle: undefined,
      seoDescription: undefined,
      canonicalUrl: undefined,
      isFeatured: undefined,
      status: undefined,
    };

    if (!values.title.trim()) {
      fieldErrors.title = "Title is required";
    }
    if (!values.slug.trim()) {
      fieldErrors.slug = "Slug is required";
    }
    if (!values.summary.trim()) {
      fieldErrors.summary = "Summary is required";
    }
    if (!values.content.trim()) {
      fieldErrors.content = "Content is required";
    }
    if (!values.authorId) {
      fieldErrors.authorId = "Please select an author";
    }
    if (!values.categoryId) {
      fieldErrors.categoryId = "Please select a category";
    }

    const hasErrors = Object.values(fieldErrors).some(Boolean);
    if (hasErrors) {
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const apiError = (await response.json()) as ApiError;
        const message = apiError?.message || "Failed to create article";

        // Map API validation errors to fields if available.
        if (apiError.details) {
          setErrors((prev) => ({ ...prev, ...apiError.details }));
        } else {
          setErrors({ title: message, slug: undefined, summary: undefined, content: undefined, authorId: undefined, categoryId: undefined, featuredImageId: undefined, tags: undefined, seoTitle: undefined, seoDescription: undefined, canonicalUrl: undefined, isFeatured: undefined, status: undefined });
        }
        return;
      }

      // Redirect to articles list on success.
      router.push("/admin/articles");
    } catch {
      setErrors({ title: "Network error. Please try again.", slug: undefined, summary: undefined, content: undefined, authorId: undefined, categoryId: undefined, featuredImageId: undefined, tags: undefined, seoTitle: undefined, seoDescription: undefined, canonicalUrl: undefined, isFeatured: undefined, status: undefined });
    } finally {
      setSaving(false);
    }
  }, [values, router]);

  // ---------------------------------------------------------------------
  // AI generation
  // ---------------------------------------------------------------------

  const generateWithAI = useCallback(async () => {
    const prompt = window.prompt(
      "What article would you like AI to write?"
    );

    if (!prompt) return;

    try {
      setIsGenerating(true);
      setAiError(undefined);

      const response = await fetch("/api/generate-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error ?? "Generation failed.");
      }

      const article = data.article;

      if (!article?.headline || !article.summary || !article.body) {
        throw new Error(
          "AI response was incomplete. Please try again or write manually."
        );
      }

      setValues((prev) => ({
        ...prev,
        title: article.headline,
        summary: article.summary,
        content: article.body,
      }));
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Unable to generate article.";
      setAiError(message);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------

  if (pageState.status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-100">
        <p className="text-sm font-semibold text-neutral-500">Loading form…</p>
      </main>
    );
  }

  if (pageState.status === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-100">
        <p className="text-sm font-semibold text-red-600">{pageState.message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-100">
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
            VIDARBHA PRINT CMS
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-normal text-neutral-950">
            Create Article
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        {aiError && (
          <div className="mb-4 border-l-4 border-red-700 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {aiError}
          </div>
        )}
        <ArticleForm
          values={values}
          authors={authors}
          categories={categories}
          featuredImageUrl={featuredImageUrl}
          loading={saving}
          errors={errors}
          onGenerateWithAI={generateWithAI}
          isGenerating={isGenerating}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/admin/articles")}
        />
      </section>
    </main>
  );
}
