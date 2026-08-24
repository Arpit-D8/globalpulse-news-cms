"use client";

import Link from "next/link";

const ACTIONS = [
  {
    href: "/admin/articles/new",
    icon: "✏️",
    title: "New Article",
    description: "Write and publish a story",
  },
  {
    href: "/admin/articles",
    icon: "📰",
    title: "All Articles",
    description: "View and manage all stories",
  },
  {
    href: "/admin/news-fetcher",
    icon: "📥",
    title: "Import News",
    description: "Fetch articles from news sources",
  },
  {
    href: "/admin/categories",
    icon: "📂",
    title: "Categories",
    description: "Manage article categories",
  },
];

export function QuickActions() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-bold text-neutral-950">Quick Actions</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group rounded-lg border border-neutral-200 p-5 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <span className="text-2xl">{action.icon}</span>
              <div>
                <p className="font-semibold text-neutral-900 group-hover:text-red-700">
                  {action.title}
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  {action.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
