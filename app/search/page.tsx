import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedArticles, searchArticles } from "@/lib/articles";
import { ArticleCard } from "@/components/site/ArticleCard";
import { BreakingTicker } from "@/components/site/BreakingTicker";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

export const runtime = "nodejs";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata | Response> {
  const { q } = await searchParams;
  const term = q?.trim();

  if (!term) {
    return {
      title: "Search News",
      description: "Search for news articles on VIDARBHA PRINT.",
    };
  }

  return {
    title: `Search: ${term} | VIDARBHA PRINT`,
    description: `Search results for "${term}" on VIDARBHA PRINT.`,
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const articles = query ? await searchArticles(query) : [];
  const breaking = await getPublishedArticles({ limit: 8 });

  return (
    <main>
      <Header />
      <BreakingTicker articles={breaking.filter((article) => article.isBreaking)} />

      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
            Search results
          </p>
          <h1 className="mt-2 border-t-4 border-neutral-950 pt-4 text-5xl font-black tracking-normal text-neutral-950 md:text-7xl">
            {query ? `"${query}"` : "Search"}
          </h1>
          {query && (
            <p className="mt-4 text-lg font-semibold text-neutral-600">
              {articles.length} result{articles.length !== 1 ? "s" : ""} found
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        {query ? (
          articles.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <ArticleCard key={article._id} article={article} />
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-neutral-300 bg-white p-8 text-center">
              <p className="text-lg font-bold text-neutral-800">
                No results found for &quot;{query}&quot;.
              </p>
              <p className="mt-2 text-neutral-600">
                Try different keywords or browse our{" "}
                <Link href="/" className="text-red-700 hover:underline">
                  homepage
                </Link>
                .
              </p>
            </div>
          )
        ) : (
          <div className="border border-dashed border-neutral-300 bg-white p-8 text-center">
            <p className="text-lg font-bold text-neutral-800">
              Enter a search term to find articles.
            </p>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
