"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CategoryModal } from "@/components/admin/categories/CategoryModal";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function NewCategoryPage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const handleCreated = () => {
    setOpen(false);
    router.push("/admin/categories");
    router.refresh();
  };

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
              <span className="text-white">New</span>
            </nav>
            <h1 className="mt-1 text-3xl font-black tracking-normal">
              New Category
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
        <CategoryModal
          open={open}
          onClose={() => setOpen(false)}
          onCreated={handleCreated}
        />
      </section>
    </main>
  );
}
