import Image from "next/image";
import Link from "next/link";
import { CATEGORY_CONFIG } from "@/lib/constants";
import type { Article } from "@/lib/types";
import { formatSiteDateShort } from "@/lib/utils/date";

type ArticleCardProps = {
  article: Article;
  priority?: boolean;
  variant?: "default" | "compact" | "hero";
};

export function getArticleImage(article: Pick<Article, "category" | "image">) {
  return article.image || CATEGORY_CONFIG[article.category].image;
}

export function ArticleCard({
  article,
  priority = false,
  variant = "default",
}: ArticleCardProps) {
  const image = getArticleImage(article);
  const isCompact = variant === "compact";
  const isHero = variant === "hero";

  return (
    <article
      className={`group border-t-4 bg-white ${CATEGORY_CONFIG[article.category].color} ${
        isHero ? "grid gap-0 md:grid-cols-[1.4fr_1fr]" : ""
      }`}
    >
      {!isCompact && (
        <Link
          href={`/articles/${article.slug}`}
          className={`relative block overflow-hidden bg-neutral-200 ${
            isHero ? "min-h-80 md:min-h-[480px]" : "aspect-[16/10]"
          }`}
        >
          <Image
            src={image}
            alt={article.title}
            fill
            priority={priority}
            sizes={isHero ? "(min-width: 768px) 58vw, 100vw" : "(min-width: 1024px) 33vw, 100vw"}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </Link>
      )}

      <div className={isHero ? "flex flex-col justify-center p-6 md:p-8" : "p-4"}>
        <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.12em]">
          <Link
            href={`/category/${CATEGORY_CONFIG[article.category].slug}`}
            className="text-red-700 hover:underline"
          >
            {article.category}
          </Link>
          <span className="text-neutral-400">/</span>
          <time className="text-neutral-500" dateTime={article.publishedAt}>
            {formatSiteDateShort(article.publishedAt)}
          </time>
        </div>

        <Link href={`/articles/${article.slug}`}>
          <h2
            className={`mt-3 font-black leading-tight tracking-normal text-neutral-950 transition group-hover:text-red-700 ${
              isHero ? "text-3xl md:text-5xl" : "text-xl"
            }`}
          >
            {article.title}
          </h2>
        </Link>

        {!isCompact && (
          <p
            className={`mt-3 leading-7 text-neutral-600 ${
              isHero ? "text-base md:text-lg" : "text-sm"
            }`}
          >
            {article.summary}
          </p>
        )}

        <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
          By {article.author}
        </p>

        {article.tags && article.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {article.tags.map((tag) => (
              <Link
                key={tag._id}
                href={`/tags/${tag.slug}`}
                className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600 transition hover:bg-red-700 hover:text-white"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
