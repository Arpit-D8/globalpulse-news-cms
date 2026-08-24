"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TagForm } from "@/components/admin/tags/TagForm";
import { useCreateTag } from "@/lib/hooks/useCreateTag";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function NewTagPage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const {
    form,
    setForm,
    errors,
    submitting,
    submitError,
    handleSubmit,
    reset,
  } = useCreateTag(() => {
    setOpen(false);
    router.push("/admin/tags");
    router.refresh();
  });

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
      onClose();
    }
  };

  const onClose = () => setOpen(false);

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
              <span className="text-white">New</span>
            </nav>
            <h1 className="mt-1 text-3xl font-black tracking-normal">
              New Tag
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
            if (e.target === e.currentTarget) handleOpenChange(false);
          }}
        >
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black tracking-tight text-neutral-950">
                New Tag
              </h2>
              <p className="mt-1 text-sm font-medium text-neutral-500">
                Add a tag to organize your content.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
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
          {submitError && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-bold text-red-700">{submitError}</p>
            </div>
          )}

          {/* Form */}
          <TagForm
            form={form}
            setForm={setForm}
            errors={errors}
            submitting={submitting}
            onSubmit={handleSubmit}
            isEdit={false}
          />
        </div>
      </section>
    </main>
  );
}
