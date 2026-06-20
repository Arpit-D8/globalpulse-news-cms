import type { Metadata } from "next";
import { AdminArticleForm } from "@/components/admin/AdminArticleForm";

export const metadata: Metadata = {
  title: "Create Article",
};

export default function NewArticlePage() {
  return (
    <main className="min-h-screen bg-neutral-100">
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
            GlobalPulse CMS
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-normal text-neutral-950">
            Create Article
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <AdminArticleForm mode="create" />
      </section>
    </main>
  );
}
