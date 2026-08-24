"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { TagForm } from "@/components/admin/tags/TagForm";
import { useEditTag } from "@/lib/hooks/useEditTag";
import { tagClient } from "@/lib/api/tagClient";
import { useState, useEffect, useCallback } from "react";
import type { AdminTag } from "@/lib/types/admin-tag";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EditTagPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [open, setOpen] = useState(true);
  const [tag, setTag] = useState<AdminTag | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTag = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tagClient.getById(id);
      setTag(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tag");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTag();
  }, [fetchTag]);

  const handleUpdated = () => {
    setOpen(false);
    router.push("/admin/tags");
    router.refresh();
  };

  // -- Loading state --
  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-100">
        <div className="mx-auto max-w-7xl p-8">
          <div className="rounded-xl bg-white p-10 text-center text-lg font-semibold text-neutral-500">
            Loading tag...
          </div>
        </div>
      </main>
    );
  }

  // -- Not found --
  if (!tag) {
    return (
      <main className="min-h-screen bg-neutral-100">
        <div className="mx-auto max-w-7xl p-8">
          <div className="rounded-xl bg-white p-10 text-center">
            <p className="text-lg font-semibold text-neutral-500">
              Tag not found.
            </p>
            <Link
              href="/admin/tags"
              className="mt-4 inline-block text-sm font-black uppercase text-red-700 hover:text-red-800"
            >
              ← Back to Tags
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // -- Render --
  return (
    <main className="min-h-screen bg-neutral-100">
      {/* Header */}
      <section className="border-b border-neutral-200 bg-neutral-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">
              VIDARBHA PRINT CMS
            </p>
            <nav className="mt-1 flex items-center gap-2 text-sm font-medium text-neutral-400">
              <Link href="/admin" className="hover:text-white">
                Admin
              </Link>
              <span>/</span>
              <Link href="/admin/tags" className="hover:text-white">
                Tags
              </Link>
              <span>/</span>
              <span className="text-white">Edit</span>
            </nav>
            <h1 className="mt-1 text-3xl font-black tracking-normal">
              Edit Tag
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/tags"
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 px-4 py-2 text-sm font-black uppercase text-neutral-300 transition hover:bg-neutral-800"
            >
              Back to Tags
            </Link>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div
          className="w-full max-w-2xl transform rounded-2xl border border-neutral-200 bg-white p-8 shadow-2xl transition-all"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black tracking-tight text-neutral-950">
                Edit Tag
              </h2>
              <p className="mt-1 text-sm font-medium text-neutral-500">
                Update the "{tag.name}" tag.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
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
          {tag && (
            <EditTagForm tag={tag} onUpdated={handleUpdated} />
          )}
        </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Sub-component
// ---------------------------------------------------------------------------

function EditTagForm({
  tag,
  onUpdated,
}: {
  tag: AdminTag;
  onUpdated: () => void;
}) {
  const {
    form,
    setForm,
    errors,
    submitting,
    submitError,
    handleSubmit,
  } = useEditTag(tag, onUpdated);

  return (
    <>
      {submitError && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-700">{submitError}</p>
        </div>
      )}

      <TagForm
        form={form}
        setForm={setForm}
        errors={errors}
        submitting={submitting}
        onSubmit={handleSubmit}
        isEdit={true}
      />
    </>
  );
}
