import type { Metadata } from "next";
import Link from "next/link";
import {
  FaArrowUpRightFromSquare,
  FaChartLine,
  FaPenToSquare,
  FaPlus,
} from "react-icons/fa6";
import { DeleteArticleButton } from "@/components/admin/DeleteArticleButton";
import { getAdminArticles } from "@/lib/articles";
import { CATEGORY_CONFIG } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Manage GlobalPulse News articles.",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function AdminDashboardPage() {
  const articles = await getAdminArticles();
  const publishedCount = articles.filter(
    (article) => article.status === "published"
  ).length;
  const draftCount = articles.length - publishedCount;
  const breakingCount = articles.filter((article) => article.isBreaking).length;

  return (
    <main className="min-h-screen bg-neutral-100">
      <section className="border-b border-neutral-200 bg-neutral-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">
              GlobalPulse CMS
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-normal">
              Admin Dashboard
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 border border-neutral-600 px-4 py-2 text-sm font-bold text-neutral-200 transition hover:border-white hover:text-white"
            >
              <FaArrowUpRightFromSquare aria-hidden="true" />
              View Site
            </Link>
            <Link
              href="/admin/articles/new"
              className="inline-flex items-center gap-2 bg-red-700 px-4 py-2 text-sm font-black uppercase text-white transition hover:bg-red-800"
            >
              <FaPlus aria-hidden="true" />
              New Article
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Published", publishedCount],
            ["Drafts", draftCount],
            ["Breaking", breakingCount],
          ].map(([label, value]) => (
            <div key={label} className="border-l-4 border-red-700 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-neutral-500">
                  {label}
                </p>
                <FaChartLine aria-hidden="true" className="text-red-700" />
              </div>
              <p className="mt-4 text-4xl font-black text-neutral-950">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 overflow-hidden bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4">
            <h2 className="text-xl font-black tracking-normal text-neutral-950">
              Articles
            </h2>
            <span className="text-sm font-semibold text-neutral-500">
              {articles.length} total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="bg-neutral-100 text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
                <tr>
                  <th className="px-5 py-3">Headline</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Updated</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {articles.length > 0 ? (
                  articles.map((article) => (
                    <tr key={article._id} className="align-top">
                      <td className="px-5 py-4">
                        <p className="font-black text-neutral-950">{article.title}</p>
                        <p className="mt-1 max-w-xl text-sm leading-6 text-neutral-600">
                          {article.summary}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/category/${CATEGORY_CONFIG[article.category].slug}`}
                          className="font-bold text-red-700 hover:underline"
                        >
                          {article.category}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-black uppercase ${
                            article.status === "published"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {article.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-neutral-600">
                        {formatDate(article.updatedAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {article.status === "published" && (
                            <Link
                              href={`/articles/${article.slug}`}
                              title="Open article"
                              className="inline-grid size-9 place-items-center border border-neutral-300 text-neutral-700 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white"
                            >
                              <FaArrowUpRightFromSquare aria-hidden="true" />
                            </Link>
                          )}
                          <Link
                            href={`/admin/articles/${article._id}/edit`}
                            title="Edit article"
                            className="inline-grid size-9 place-items-center border border-neutral-300 text-neutral-700 transition hover:border-red-700 hover:bg-red-700 hover:text-white"
                          >
                            <FaPenToSquare aria-hidden="true" />
                          </Link>
                          <DeleteArticleButton
                            articleId={article._id}
                            title={article.title}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-sm font-semibold text-neutral-600"
                    >
                      No articles yet. Create the first story to populate the site.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
