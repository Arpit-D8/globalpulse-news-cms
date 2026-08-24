import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";
import type { Article, Category } from "@/lib/types";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { ArticleCard } from "./ArticleCard";

export type ArticlesByCategory = Record<Category, Article[]>;

export function CategorySections({ articles }: { articles: ArticlesByCategory }) {
  return (
    <section className="bg-white py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {(Object.keys(CATEGORY_CONFIG) as Category[]).map((category) => (
            <div key={category} className="border-t-4 border-neutral-950 pt-4">
              <div className="min-h-28">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-red-700">
                  {CATEGORY_CONFIG[category].kicker}
                </p>
                <Link
                  href={`/category/${CATEGORY_CONFIG[category].slug}`}
                  className="mt-1 inline-flex items-center gap-2 text-2xl font-black tracking-normal text-neutral-950 hover:text-red-700"
                >
                  {category}
                  <FaArrowRight aria-hidden="true" className="text-sm" />
                </Link>
              </div>
              <div className="divide-y divide-neutral-200">
                {articles[category].length > 0 ? (
                  articles[category].slice(0, 3).map((article) => (
                    <ArticleCard
                      key={article._id}
                      article={article}
                      variant="compact"
                    />
                  ))
                ) : (
                  <p className="py-4 text-sm leading-6 text-neutral-600">
                    Coverage appears here after publishing.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
