import Link from "next/link";
import type { Metadata } from "next";
import { FaArrowRight, FaPlus } from "react-icons/fa6";
import { ArticleCard } from "@/components/site/ArticleCard";
import { BreakingTicker } from "@/components/site/BreakingTicker";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { CATEGORY_CONFIG, CATEGORIES, FALLBACK_HERO_IMAGE } from "@/lib/constants";
import { getHomepageArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Breaking News, Latest Headlines and Analysis",
  description:
    "Read the latest headlines across India, World, Business, Technology, and Sports on GlobalPulse News.",
};

export default async function Home() {
  const { hero, latest, breaking, byCategory } = await getHomepageArticles();
  const topUpdates = latest.slice(0, 5);

  return (
    <main>
      <Header />
      <BreakingTicker articles={breaking} />

      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
          <div>
            {hero ? (
              <ArticleCard article={hero} priority variant="hero" />
            ) : (
              <div className="grid bg-white md:grid-cols-[1.4fr_1fr]">
                <div className="min-h-80 overflow-hidden bg-neutral-200 md:min-h-[480px]">
                  <img
                    src={FALLBACK_HERO_IMAGE}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-col justify-center border-t-4 border-red-700 p-6 md:p-8">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-red-700">
                    Newsroom ready
                  </p>
                  <h1 className="mt-3 text-3xl font-black leading-tight tracking-normal text-neutral-950 md:text-5xl">
                    Publish your first lead story
                  </h1>
                  <p className="mt-4 text-base leading-7 text-neutral-600 md:text-lg">
                    Create a featured article in the admin dashboard to fill the
                    homepage hero, ticker, and category sections.
                  </p>
                  <Link
                    href="/admin/articles/new"
                    className="mt-6 inline-flex w-fit items-center gap-2 bg-red-700 px-5 py-3 text-sm font-black uppercase text-white transition hover:bg-red-800"
                  >
                    <FaPlus aria-hidden="true" />
                    New Article
                  </Link>
                </div>
              </div>
            )}
          </div>

          <aside className="border-t-4 border-neutral-950 bg-neutral-50 p-5">
            <div className="flex items-center justify-between border-b border-neutral-300 pb-3">
              <h2 className="text-xl font-black uppercase tracking-normal">
                Top Updates
              </h2>
              <span className="text-xs font-bold uppercase text-red-700">Live</span>
            </div>

            <div className="divide-y divide-neutral-200">
              {topUpdates.length > 0 ? (
                topUpdates.map((article) => (
                  <ArticleCard key={article._id} article={article} variant="compact" />
                ))
              ) : (
                <p className="py-5 text-sm leading-6 text-neutral-600">
                  Latest updates will appear here after articles are published.
                </p>
              )}
            </div>
          </aside>
        </div>
      </section>

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

        {latest.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {latest.slice(0, 6).map((article) => (
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

      <section className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 lg:grid-cols-5">
            {CATEGORIES.map((category) => (
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
                  {byCategory[category].length > 0 ? (
                    byCategory[category].slice(0, 3).map((article) => (
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

      <Footer />
    </main>
  );
}
