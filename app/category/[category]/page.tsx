import type { Metadata } from "next";
import Link from "next/link";
import Category from "@/models/Category";
import { connectDB } from "@/lib/mongodb";
import { getCategoryFromSlug } from "@/lib/constants";
import { getPublishedArticles } from "@/lib/articles";
import { ArticleCard } from "@/components/site/ArticleCard";
import { BreakingTicker } from "@/components/site/BreakingTicker";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { notFound } from "next/navigation";

export const runtime = "nodejs";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ tag?: string }>;
};

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata | Response> {
  const { category: slug } = await params;
  const category = getCategoryFromSlug(slug);

  if (!category) {
    return new Response(null, { status: 404 });
  }

  return {
    title: `${category} News`,
    description: `Latest ${category} headlines, analysis, and breaking news from VIDARBHA PRINT News.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: slug } = await params;
  const categoryName = getCategoryFromSlug(slug);

  if (!categoryName) {
    notFound();
  }

  // Look up Category by slug to get ObjectId
  await connectDB();
  const categoryDoc = await Category.findOne({ slug }).lean();

  // Fallback: if category not found in DB, use category name string for query
  const categoryFilter = categoryDoc?._id.toString() ?? categoryName;

  const articles = await getPublishedArticles({ category: categoryFilter, limit: 40 });
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
            VIDARBHA PRINT section
          </p>
          <h1 className="mt-2 border-t-4 border-neutral-950 pt-4 text-5xl font-black tracking-normal text-neutral-950 md:text-7xl">
            {categoryName}
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
              No {categoryName} articles have been published yet.
            </p>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
