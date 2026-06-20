"use client";

import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaFloppyDisk } from "react-icons/fa6";
import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import type { Article, ArticleStatus, Category } from "@/lib/types";

type AdminArticleFormProps = {
  article?: Article;
  mode: "create" | "edit";
};

type FormState = {
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: Category;
  image: string;
  author: string;
  isBreaking: boolean;
  isFeatured: boolean;
  status: ArticleStatus;
  publishedAt: string;
};

function toDatetimeLocal(value?: string) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 16);
  }

  return date.toISOString().slice(0, 16);
}

export function AdminArticleForm({ article, mode }: AdminArticleFormProps) {
  const router = useRouter();
  const initialState = useMemo<FormState>(
    () => ({
      title: article?.title ?? "",
      slug: article?.slug ?? "",
      summary: article?.summary ?? "",
      content: article?.content ?? "",
      category: article?.category ?? "India",
      image: article?.image ?? "",
      author: article?.author ?? "GlobalPulse Desk",
      isBreaking: article?.isBreaking ?? false,
      isFeatured: article?.isFeatured ?? false,
      status: article?.status ?? "published",
      publishedAt: toDatetimeLocal(article?.publishedAt),
    }),
    [article]
  );
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function updateField(
    event:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLTextAreaElement>
      | ChangeEvent<HTMLSelectElement>
  ) {
    const target = event.target;
    const { name, value } = target;

    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      const checked = target.checked;
      setForm((current) => ({ ...current, [name]: checked }));
      return;
    }

    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    const endpoint =
      mode === "edit" && article
        ? `/api/articles/${article._id}`
        : "/api/articles";
    const method = mode === "edit" ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error || "Unable to save article.");
      }

      router.push("/admin");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save article."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 border border-neutral-300 px-4 py-2 text-sm font-bold text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
        >
          <FaArrowLeft aria-hidden="true" />
          Back
        </Link>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 bg-red-700 px-5 py-3 text-sm font-black uppercase text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
        >
          <FaFloppyDisk aria-hidden="true" />
          {isSaving ? "Saving" : "Save Article"}
        </button>
      </div>

      {error && (
        <div className="border-l-4 border-red-700 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <label className="block">
            <span className="cms-label">Headline</span>
            <input
              name="title"
              value={form.title}
              onChange={updateField}
              required
              className="cms-input text-2xl font-black"
            />
          </label>

          <label className="block">
            <span className="cms-label">Slug</span>
            <input
              name="slug"
              value={form.slug}
              onChange={updateField}
              className="cms-input"
            />
          </label>

          <label className="block">
            <span className="cms-label">Summary</span>
            <textarea
              name="summary"
              value={form.summary}
              onChange={updateField}
              rows={3}
              className="cms-input resize-y"
            />
          </label>

          <label className="block">
            <span className="cms-label">Article Body</span>
            <textarea
              name="content"
              value={form.content}
              onChange={updateField}
              required
              rows={16}
              className="cms-input resize-y leading-7"
            />
          </label>
        </div>

        <aside className="space-y-5">
          <label className="block">
            <span className="cms-label">Category</span>
            <select
              name="category"
              value={form.category}
              onChange={updateField}
              className="cms-input"
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="cms-label">Author</span>
            <input
              name="author"
              value={form.author}
              onChange={updateField}
              className="cms-input"
            />
          </label>

          <label className="block">
            <span className="cms-label">Image URL</span>
            <input
              name="image"
              value={form.image}
              onChange={updateField}
              className="cms-input"
            />
          </label>

          <label className="block">
            <span className="cms-label">Status</span>
            <select
              name="status"
              value={form.status}
              onChange={updateField}
              className="cms-input"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </label>

          <label className="block">
            <span className="cms-label">Published At</span>
            <input
              type="datetime-local"
              name="publishedAt"
              value={form.publishedAt}
              onChange={updateField}
              className="cms-input"
            />
          </label>

          <div className="space-y-3 border border-neutral-200 bg-white p-4">
            <label className="flex items-center gap-3 text-sm font-bold text-neutral-800">
              <input
                type="checkbox"
                name="isBreaking"
                checked={form.isBreaking}
                onChange={updateField}
                className="size-4 accent-red-700"
              />
              Breaking news
            </label>
            <label className="flex items-center gap-3 text-sm font-bold text-neutral-800">
              <input
                type="checkbox"
                name="isFeatured"
                checked={form.isFeatured}
                onChange={updateField}
                className="size-4 accent-red-700"
              />
              Featured hero
            </label>
          </div>
        </aside>
      </div>
    </form>
  );
}
