"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AuthorForm } from "@/components/admin/authors/AuthorForm";
import { generateSlug } from "@/lib/slug";
import type { AuthorCreateInput } from "@/lib/types/author";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMPTY_FORM: AuthorCreateInput = {
  name: "",
  slug: "",
  bio: "",
  photoUrl: "",
  email: "",
  twitterHandle: "",
  websiteUrl: "",
  isActive: true,
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function NewAuthorPage() {
  const router = useRouter();

  const [form, setForm] = useState<AuthorCreateInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof AuthorCreateInput, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  // -----------------------------------------------------------------------
  // Auto-generate slug from name
  // -----------------------------------------------------------------------

  const handleNameChange = useCallback(
    (value: string) => {
      setForm((prev) => ({
        ...prev,
        name: value,
        slug: generateSlug(value),
      }));
    },
    []
  );

  // -----------------------------------------------------------------------
  // Form submission
  // -----------------------------------------------------------------------

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate required fields.
      const fieldErrors: Partial<Record<keyof AuthorCreateInput, string>> = {};

      if (!form.name.trim()) {
        fieldErrors.name = "Author name is required";
      }
      if (!form.slug.trim()) {
        fieldErrors.slug = "Slug is required";
      }

      const hasErrors = Object.values(fieldErrors).some(Boolean);
      if (hasErrors) {
        setErrors(fieldErrors);
        return;
      }

      setSubmitting(true);
      setErrors({});

      try {
        const response = await fetch("/api/admin/authors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        if (!response.ok) {
          const apiError = await response.json().catch(() => ({}));
          const message = apiError?.error?.message || "Failed to create author";

          // Map API validation errors to fields if available.
          if (apiError?.error?.details) {
            setErrors(apiError.error.details);
          } else {
            setErrors({ name: message });
          }
          return;
        }

        // Redirect to authors list on success.
        router.push("/admin/authors");
      } catch {
        setErrors({ name: "Network error. Please try again." });
      } finally {
        setSubmitting(false);
      }
    },
    [form, router]
  );

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <main className="min-h-screen bg-neutral-100">
      {/* Header */}
      <section className="border-b border-neutral-200 bg-neutral-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">
            VIDARBHA PRINT CMS
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-normal">
            New Author
          </h1>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
          <AuthorForm
            form={form}
            setForm={(updated) => {
              // Preserve name->slug sync when updating non-name fields.
              if (updated.name !== form.name) {
                handleNameChange(updated.name);
              } else {
                setForm(updated);
              }
            }}
            errors={errors}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        </div>
      </section>
    </main>
  );
}
