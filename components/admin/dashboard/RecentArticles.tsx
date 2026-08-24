"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Article = {
  _id: string;
  title: string;
  category: string;
  status: string;
  image?: string;
  publishedAt: string;
  updatedAt: string;
};

export function RecentArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/recent-articles")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setArticles(data.data.articles);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center text-neutral-500">
        Loading...
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center text-neutral-500">
        No articles yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
        <h2 className="text-lg font-bold text-neutral-950">Recent Articles</h2>
        <Link
          href="/admin/articles"
          className="text-sm font-semibold text-red-700 hover:underline"
        >
          View All Articles
        </Link>
      </div>

      <ul className="divide-y divide-neutral-200">
        {articles.map((article) => (
          <li key={article._id}>
            <Link href={`/admin/articles/${article._id}/edit`}>
              <div className="flex items-center gap-4 px-6 py-4 transition hover:bg-neutral-50">
                {article.image ? (
                  <img
                    src={article.image}
                    alt=""
                    className="size-12 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="size-12 shrink-0 rounded-lg bg-neutral-100" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-neutral-900">
                    {article.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-neutral-500">
                    <span>{article.category}</span>
                    <span>·</span>
                    <span>
                      {article.status === "published"
                        ? `Published ${timeAgo(article.publishedAt)}`
                        : `Updated ${timeAgo(article.updatedAt)}`}
                    </span>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    article.status === "published"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {article.status}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  const intervals = [
    { label: "yr", seconds: 31536000 },
    { label: "d", seconds: 86400 },
    { label: "h", seconds: 3600 },
    { label: "m", seconds: 60 },
  ];
  for (const { label, seconds: sec } of intervals) {
    const count = Math.floor(seconds / sec);
    if (count >= 1) return `${count}${label} ago`;
  }
  return "just now";
}
