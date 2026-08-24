"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArticleForm, type ArticleFormValues, type AuthorOption, type CategoryOption } from "@/components/admin/article/ArticleForm";
import { generateSlug } from "@/lib/slug";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PageState =
  | { status: "loading" }
  | { status: "notFound" }
  | { status: "error"; message: string }
  | { status: "ready" };

type ApiError = {
  message: string;
  details?: Record<string, string>;
};

/**
 * Shape of the article returned by GET /api/admin/articles/[id].
 *
 * The API route now populates tags, so tags is an array of { _id, name, slug }
 * objects.  Other ObjectId refs (author, category, featuredImage) are returned
 * as plain strings at JSON-serialisation time.
 */
type ArticleApi = {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  author: string;       // ObjectId ref to Author → maps to authorId
  category: string;     // ObjectId ref to Category → maps to categoryId
  featuredImage: string; // ObjectId ref to Media → maps to featuredImageId
  tags: Array<{ _id: string; name: string; slug: string }>;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  isFeatured: boolean;
  status: ArticleFormValues["status"];
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

/**
 * Edit Article page.
 *
 * Fetches the existing article, authors, and categories on mount, populates
 * the controlled ArticleForm, and submits via PUT to /api/admin/articles/[id].
 */
export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

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
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | undefined>(undefined);

  // Tracks whether the user has manually edited the slug field.
  const slugManuallyEdited = useRef(false);

  // ---------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function init() {
      try {
        const [articleRes, authorsRes, categoriesRes] = await Promise.all([
          fetch(`/api/admin/articles/${id}`, { signal }),
          fetch("/api/admin/authors", { signal }),
          fetch("/api/admin/categories", { signal }),
        ]);

        if (!articleRes.ok) {
          if (articleRes.status === 404) {
            setPageState({ status: "notFound" });
            return;
          }
          throw new Error("Failed to load article");
        }

        if (!authorsRes.ok || !categoriesRes.ok) {
          throw new Error("Failed to load authors or categories");
        }

        const articleData = (await articleRes.json()) as { success: boolean; data: ArticleApi };
        const authorsData = (await authorsRes.json()) as { success: boolean; data: { authors: AuthorOption[]; pagination: unknown } };
        const categoriesData = (await categoriesRes.json()) as { success: boolean; data: { categories: CategoryOption[]; pagination: unknown } };

        // Populate form values from the fetched article.
        const article = articleData.data;
        setValues({
          title: article.title ?? "",
          slug: article.slug ?? "",
          summary: article.summary ?? "",
          content: article.content ?? "",
          authorId: article.author ?? "",
          categoryId: article.category ?? "",
          featuredImageId: article.featuredImage ?? "",
          tags: article.tags.map((t) => t._id),
          seoTitle: article.seoTitle ?? "",
          seoDescription: article.seoDescription ?? "",
          canonicalUrl: article.canonicalUrl ?? "",
          isFeatured: Boolean(article.isFeatured),
          status: article.status ?? "draft",
        });
        setAuthors(authorsData.data.authors.map(a => ({ _id: a._id, name: a.name })));
        setCategories(categoriesData.data.categories.map(c => ({ _id: c._id, name: c.name })));
        setPageState({ status: "ready" });

        // Fetch the Media URL for the featured image preview.
        if (article.featuredImage) {
          try {
            const mediaRes = await fetch(`/api/admin/media/${article.featuredImage}`, { signal });
            if (mediaRes.ok) {
              const mediaData = await mediaRes.json();
              if (mediaData.success && mediaData.data?.url) {
                setFeaturedImageUrl(mediaData.data.url);
              }
            }
          } catch {
            // Ignore media fetch errors - preview will just be empty
          }
        }

        // Reset slug manual-edit tracking for the newly loaded article.
        slugManuallyEdited.current = false;
      } catch (err) {
        // Ignore AbortError — the request was intentionally cancelled.
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        const message = err instanceof Error ? err.message : "Failed to load data";
        setPageState({ status: "error", message });
      }
    }

    if (id) {
      init();
    }

    return () => {
      controller.abort();
    };
  }, [id]);

  // ---------------------------------------------------------------------
  // Auto-generate slug from title
  // ---------------------------------------------------------------------

  /**
   * Auto-generate the slug whenever the title changes, but only
   * if the user hasn't already typed a custom slug.
   */
  useEffect(() => {
    if (pageState.status !== "ready") return;

    if (!slugManuallyEdited.current) {
      setValues((prev) => ({ ...prev, slug: generateSlug(prev.title) }));
    }
  }, [values.title, pageState.status]);

  // ---------------------------------------------------------------------
  // Form handlers
  // ---------------------------------------------------------------------

  const handleChange = useCallback(
    (field: keyof ArticleFormValues, value: string | boolean | string[]) => {
      // Mark slug as manually edited when the user types in the slug field.
      if (field === "slug") {
        slugManuallyEdited.current = true;
      }

      // When featuredImageId changes, clear the preview URL.
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
      const response = await fetch(`/api/admin/articles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const apiError = (await response.json()) as ApiError;
        const message = apiError?.message || "Failed to update article";

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
  }, [values, id, router]);

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------

  if (pageState.status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-100">
        <p className="text-sm font-semibold text-neutral-500">Loading article…</p>
      </main>
    );
  }

  if (pageState.status === "notFound") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-100">
        <p className="text-sm font-semibold text-neutral-500">Article not found.</p>
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
            Edit Article
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <ArticleForm
          values={values}
          authors={authors}
          categories={categories}
          featuredImageUrl={featuredImageUrl}
          loading={saving}
          errors={errors}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/admin/articles")}
        />
      </section>
    </main>
  );
}
