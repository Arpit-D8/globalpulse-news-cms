import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/site/ArticleCard";
import { BreakingTicker } from "@/components/site/BreakingTicker";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getArticlesByTag, getPublishedArticles } from "@/lib/articles";
import TagModel from "@/models/Tag";
import { connectDB } from "@/lib/mongodb";
import { allSettledWithFallback } from "@/lib/failure-isolation";

export const dynamic = "force-dynamic";

type TagPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  await connectDB();
  const tagDoc = await TagModel.findOne({ slug, isActive: true }).lean();

  if (!tagDoc) {
    return {
      title: "Tag not found",
    };
  }

  return {
    title: `${tagDoc.name} News`,
    description: `Latest articles tagged with "${tagDoc.name}" from VIDARBHA PRINT News.`,
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params;
  await connectDB();
  const tagDoc = await TagModel.findOne({ slug, isActive: true }).lean();

  if (!tagDoc) {
    notFound();
  }

  /**
   * Fetch tag page data with failure isolation.
   *
   * Tag articles and breaking news are fetched concurrently. If breaking
   * news fails, the ticker is silently skipped — the tag articles still render.
   */
  const results = await allSettledWithFallback(
    {
      tagArticles: () => getArticlesByTag(slug, { limit: 40 }),
      breaking: () => getPublishedArticles({ limit: 8 }),
    },
    {
      fallback: {
        tagArticles: [],
        breaking: [],
      },
    }
  );

  // Extract values from settled results (already unwrapped by allSettledWithFallback).
  const articles = (results.tagArticles ?? []) as any[];
  const breaking = (results.breaking ?? []) as any[];
  const breakingArticles = breaking.filter((a: any) => a.isBreaking);
  const lead = articles[0];
  const rest = articles.slice(1);

  if (articles.length === 0) {
    notFound();
  }

  return (
    <main>
      <Header />
      <BreakingTicker articles={breakingArticles} />

      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
            Tagged articles
          </p>
          <h1 className="mt-2 border-t-4 border-neutral-950 pt-4 text-5xl font-black tracking-normal text-neutral-950 md:text-7xl">
            {tagDoc.name}
          </h1>
          <p className="mt-4 text-lg font-semibold text-neutral-600">
            {articles.length} article{articles.length !== 1 ? "s" : ""} tagged with &ldquo;{tagDoc.name}&rdquo;
          </p>
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
              No articles found with this tag.
            </p>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
