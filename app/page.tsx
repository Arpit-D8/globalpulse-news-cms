import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import type { Metadata } from "next";
import { FaPlus } from "react-icons/fa6";
import { ArticleCard } from "@/components/site/ArticleCard";
import { BreakingTicker } from "@/components/site/BreakingTicker";
import { CategorySections } from "@/components/site/CategorySections";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { LatestStories } from "@/components/site/LatestStories";
import { TopUpdates } from "@/components/site/TopUpdates";
import { CATEGORY_CONFIG, CATEGORIES, FALLBACK_HERO_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/constants";
import { getHomepageArticles, getPublishedArticles } from "@/lib/articles";
import { allSettledWithFallback } from "@/lib/failure-isolation";
import type { ArticlesByCategory } from "@/components/site/CategorySections";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Latest Breaking News, Top Stories & Analysis | VIDARBHA PRINT",
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    title: "Latest Breaking News, Top Stories & Analysis | VIDARBHA PRINT",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: FALLBACK_HERO_IMAGE,
        width: 1600,
        height: 900,
        alt: `${SITE_NAME} — homepage hero image`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Latest Breaking News, Top Stories & Analysis | VIDARBHA PRINT",
    description: SITE_DESCRIPTION,
    images: [FALLBACK_HERO_IMAGE],
  },
};

const homepageJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
    },
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: "Latest Breaking News, Top Stories & Analysis | VIDARBHA PRINT",
      isPartOf: {
        "@id": `${SITE_URL}/#website`,
      },
      about: {
        "@id": `${SITE_URL}/#organization`,
      },
      description: SITE_DESCRIPTION,
      inLanguage: "en-US",
    },
  ],
};

/**
 * Fetch homepage data with failure isolation.
 *
 * Each data source (hero, latest, breaking, categories) runs concurrently.
 * If one fails, the others still render — the page degrades gracefully.
 */
async function getHomepageData() {
  const results = await allSettledWithFallback(
    {
      hero: () =>
        getPublishedArticles({ limit: 1 }).then(
          (articles) => articles[0] ?? null
        ),
      latest: () => getPublishedArticles({ limit: 12 }),
      breaking: () =>
        getPublishedArticles({ limit: 8 }).then((articles) =>
          articles.filter((a) => a.isBreaking)
        ),
      byCategory: () => getHomepageArticles().then((d) => d.byCategory),
    },
    {
      fallback: {
        hero: null,
        latest: [],
        breaking: [],
        byCategory: CATEGORIES.reduce(
          (sections, category) => ({
            ...sections,
            [category]: [],
          }),
          {} as Record<string, any[]>
        ),
      },
    }
  );

  // Extract values from settled results (already unwrapped by allSettledWithFallback).
  const hero = (results.hero ?? null) as any;
  const latest = (results.latest ?? []) as any[];
  const breaking = (results.breaking ?? []) as any[];
  const byCategory = (results.byCategory ?? {}) as Record<string, any[]>;

  // Fallback: if hero failed, use first latest article
  const effectiveHero = hero ?? (latest.length > 0 ? latest[0] : null);
  const effectiveLatest = effectiveHero
    ? latest.filter((a) => a._id !== effectiveHero?._id).slice(0, 12)
    : latest.slice(0, 12);
  const effectiveBreaking = breaking.filter((a) => a._id !== effectiveHero?._id);

  return {
    hero: effectiveHero,
    latest: effectiveLatest,
    breaking: effectiveBreaking,
    byCategory,
  };
}

export default async function Home() {
  const { hero, latest, breaking, byCategory } = await getHomepageData();
  const topUpdates = latest.slice(0, 5);

  return (
    <main>
      <Script
        id="homepage-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageJsonLd) }}
      />
      <Header />
      <BreakingTicker articles={breaking} />

      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
          <div>
            {hero ? (
              <ArticleCard article={hero} priority variant="hero" />
            ) : (
              <div className="grid bg-white md:grid-cols-[1.4fr_1fr]">
                <div className="relative min-h-80 overflow-hidden bg-neutral-200 md:min-h-[480px]">
                  <Image
                    src={FALLBACK_HERO_IMAGE}
                    alt=""
                    fill
                    priority
                    sizes="(min-width: 768px) 58vw, 100vw"
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

          <TopUpdates articles={topUpdates} />
        </div>
      </section>

      <LatestStories articles={latest} />
      <CategorySections articles={byCategory as ArticlesByCategory} />

      <Footer />
    </main>
  );
}
