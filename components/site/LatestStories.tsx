import Link from "next/link";
import { FaPlus } from "react-icons/fa6";
import type { Article } from "@/lib/types";
import { ArticleCard } from "./ArticleCard";

export function LatestStories({ articles }: { articles: Article[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-5 flex items-end justify-between gap-4 border-b-4 border-neutral-950 pb-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
            Editors&apos; desk
          </p>
          <h2 className="text-3xl font-black tracking-normal text-neutral-950">
            Latest Stories
          </h2>
        </div>
        <Link
          href="/admin/articles/new"
          className="hidden items-center gap-2 text-sm font-black uppercase text-red-700 hover:underline sm:inline-flex"
        >
          <FaPlus aria-hidden="true" />
          Add Story
        </Link>
      </div>

      {articles.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.slice(0, 6).map((article) => (
            <ArticleCard key={article._id} article={article} />
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-neutral-300 bg-white p-8 text-center">
          <p className="text-lg font-bold text-neutral-800">
            No published articles yet.
          </p>
          <Link
            href="/admin/articles/new"
            className="mt-4 inline-flex items-center gap-2 bg-neutral-950 px-5 py-3 text-sm font-black uppercase text-white transition hover:bg-red-700"
          >
            <FaPlus aria-hidden="true" />
            Create Article
          </Link>
        </div>
      )}
    </section>
  );
}
