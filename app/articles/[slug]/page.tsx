import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa6";
import { ArticleCard, getArticleImage } from "@/components/site/ArticleCard";
import { BreakingTicker } from "@/components/site/BreakingTicker";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import {
  getArticleBySlug,
  getPublishedArticles,
} from "@/lib/articles";
import { CATEGORY_CONFIG } from "@/lib/constants";

export const dynamic = "force-dynamic";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "full",
  }).format(new Date(value));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article not found",
    };
  }

  return {
    title: article.title,
    description: article.summary,
    openGraph: {
      title: article.title,
      description: article.summary,
      type: "article",
      publishedTime: article.publishedAt,
      authors: [article.author],
      images: [getArticleImage(article)],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary,
      images: [getArticleImage(article)],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const related = await getPublishedArticles({
    category: article.category,
    excludeSlug: article.slug,
    limit: 3,
  });
  const breaking = await getPublishedArticles({ limit: 8 });

  return (
    <main>
      <Header />
      <BreakingTicker articles={breaking.filter((item) => item.isBreaking)} />

      <article className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <Link
            href={`/category/${CATEGORY_CONFIG[article.category].slug}`}
            className="inline-flex items-center gap-2 text-sm font-black uppercase text-red-700 hover:underline"
          >
            <FaArrowLeft aria-hidden="true" />
            {article.category}
          </Link>

          <div className="mt-6 border-t-4 border-neutral-950 pt-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
              {article.isBreaking ? "Breaking News" : CATEGORY_CONFIG[article.category].kicker}
            </p>
            <h1 className="mt-3 text-4xl font-black leading-tight tracking-normal text-neutral-950 md:text-6xl">
              {article.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-neutral-600 md:text-xl">
              {article.summary}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-neutral-200 py-4 text-sm font-semibold text-neutral-600">
              <span>By {article.author}</span>
              <time dateTime={article.publishedAt}>
                {formatDate(article.publishedAt)}
              </time>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4">
          <img
            src={getArticleImage(article)}
            alt=""
            className="max-h-[620px] w-full object-cover"
          />
        </div>

        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 lg:grid-cols-[1fr_280px]">
          <div className="prose-news text-lg">
            {article.content.split(/\n{2,}/).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <aside className="border-t-4 border-red-700 pt-4">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-neutral-950">
              Related
            </p>
            <div className="mt-3 divide-y divide-neutral-200">
              {related.length > 0 ? (
                related.map((item) => (
                  <ArticleCard key={item._id} article={item} variant="compact" />
                ))
              ) : (
                <p className="py-4 text-sm leading-6 text-neutral-600">
                  More {article.category} stories will appear here.
                </p>
              )}
            </div>
          </aside>
        </div>
      </article>

      <Footer />
    </main>
  );
}
