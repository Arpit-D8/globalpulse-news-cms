import Link from "next/link";
import { FaBolt } from "react-icons/fa6";
import type { Article } from "@/lib/types";

type BreakingTickerProps = {
  articles: Article[];
};

export function BreakingTicker({ articles }: BreakingTickerProps) {
  const items =
    articles.length > 0
      ? articles
      : [
          {
            _id: "empty",
            title: "Breaking desk ready. Publish a breaking article from admin.",
            slug: "",
          },
        ];

  return (
    <section className="border-y border-red-800 bg-red-700 text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr] items-center overflow-hidden px-4">
        <div className="inline-flex items-center gap-2 bg-neutral-950 px-3 py-3 text-sm font-black uppercase">
          <FaBolt aria-hidden="true" className="text-amber-300" />
          Breaking
        </div>
        <div className="ticker-mask overflow-hidden">
          <div className="ticker-track flex min-w-max items-center gap-8 py-3 text-sm font-semibold">
            {[...items, ...items].map((article, index) =>
              article.slug ? (
                <Link
                  key={`${article._id}-${index}`}
                  href={`/articles/${article.slug}`}
                  className="whitespace-nowrap hover:underline"
                >
                  {article.title}
                </Link>
              ) : (
                <span key={`${article._id}-${index}`} className="whitespace-nowrap">
                  {article.title}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
