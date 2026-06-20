import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminArticleForm } from "@/components/admin/AdminArticleForm";
import { getArticleById } from "@/lib/articles";

export const dynamic = "force-dynamic";

type EditArticlePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: EditArticlePageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticleById(id);

  return {
    title: article ? `Edit ${article.title}` : "Edit Article",
  };
}

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = await params;
  const article = await getArticleById(id);

  if (!article) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-neutral-100">
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
            GlobalPulse CMS
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-normal text-neutral-950">
            Edit Article
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <AdminArticleForm mode="edit" article={article} />
      </section>
    </main>
  );
}
