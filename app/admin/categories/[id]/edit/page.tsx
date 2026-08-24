"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CategoryModal } from "@/components/admin/categories/CategoryModal";
import { categoryClient } from "@/lib/api/categoryClient";
import { useState, useEffect, useCallback } from "react";
import type { Category } from "@/lib/types/category";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [open, setOpen] = useState(true);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await categoryClient.getById(id);
      setCategory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch category");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCategory();
  }, [fetchCategory]);

  const handleUpdated = () => {
    setOpen(false);
    router.push("/admin/categories");
    router.refresh();
  };

  // -- Loading state --
  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-100">
        <div className="mx-auto max-w-7xl p-8">
          <div className="rounded-xl bg-white p-10 text-center text-lg font-semibold text-neutral-500">
            Loading category...
          </div>
        </div>
      </main>
    );
  }

  // -- Not found --
  if (!category) {
    return (
      <main className="min-h-screen bg-neutral-100">
        <div className="mx-auto max-w-7xl p-8">
          <div className="rounded-xl bg-white p-10 text-center">
            <p className="text-lg font-semibold text-neutral-500">
              Category not found.
            </p>
            <Link
              href="/admin/categories"
              className="mt-4 inline-block text-sm font-black uppercase text-red-700 hover:text-red-800"
            >
              ← Back to Categories
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
              <Link href="/admin/categories" className="hover:text-white">
                Categories
              </Link>
              <span>/</span>
              <span className="text-white">Edit</span>
            </nav>
            <h1 className="mt-1 text-3xl font-black tracking-normal">
              Edit Category
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/categories"
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 px-4 py-2 text-sm font-black uppercase text-neutral-300 transition hover:bg-neutral-800"
            >
              Back to Categories
            </Link>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <CategoryModal
          open={open}
          onClose={() => setOpen(false)}
          onUpdated={handleUpdated}
          category={category}
        />
      </section>
    </main>
  );
}
