import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/site/ArticleCard";
import { BreakingTicker } from "@/components/site/BreakingTicker";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getCategoryFromSlug } from "@/lib/constants";
import { getPublishedArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategoryFromSlug(slug);

  if (!category) {
    return {
      title: "Category not found",
    };
  }

  return {
    title: `${category} News`,
    description: `Latest ${category} headlines, analysis, and breaking news from GlobalPulse News.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: slug } = await params;
  const category = getCategoryFromSlug(slug);

  if (!category) {
    notFound();
  }

  const articles = await getPublishedArticles({ category, limit: 40 });
  const breaking = await getPublishedArticles({ limit: 8 });
  const lead = articles[0];
  const rest = articles.slice(1);

  return (
    <main>
      <Header />
      <BreakingTicker articles={breaking.filter((article) => article.isBreaking)} />

      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
            GlobalPulse section
          </p>
          <h1 className="mt-2 border-t-4 border-neutral-950 pt-4 text-5xl font-black tracking-normal text-neutral-950 md:text-7xl">
            {category}
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        {lead ? (
          <>
            <ArticleCard article={lead} priority variant="hero" />
            {rest.length > 0 && (
              <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((article) => (
                  <ArticleCard key={article._id} article={article} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="border border-dashed border-neutral-300 bg-white p-8 text-center">
            <p className="text-lg font-bold text-neutral-800">
              No {category} articles have been published yet.
            </p>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
