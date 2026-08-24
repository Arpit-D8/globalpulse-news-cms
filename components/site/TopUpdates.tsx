import type { Article } from "@/lib/types";
import { ArticleCard } from "./ArticleCard";

export function TopUpdates({ articles }: { articles: Article[] }) {
  return (
    <aside className="border-t-4 border-neutral-950 bg-neutral-50 p-5">
      <div className="flex items-center justify-between border-b border-neutral-300 pb-3">
        <h2 className="text-xl font-black uppercase tracking-normal">Top Updates</h2>
        <span className="text-xs font-bold uppercase text-red-700">Live</span>
      </div>

      <div className="divide-y divide-neutral-200">
        {articles.length > 0 ? (
          articles.map((article) => (
            <ArticleCard key={article._id} article={article} variant="compact" />
          ))
        ) : (
          <p className="py-5 text-sm leading-6 text-neutral-600">
            Latest updates will appear here after articles are published.
          </p>
        )}
      </div>
    </aside>
  );
}
