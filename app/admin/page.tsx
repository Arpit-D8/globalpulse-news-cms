import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { FaPlus } from "react-icons/fa6";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { RecentArticles } from "@/components/admin/dashboard/RecentArticles";
import { QuickActions } from "@/components/admin/dashboard/QuickActions";
import { ArticlesTable } from "@/components/admin/dashboard/ArticlesTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Manage VIDARBHA PRINT News articles.",
};

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-neutral-100">
      <section className="border-b border-neutral-200 bg-neutral-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">
              VIDARBHA PRINT CMS
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-normal">
              Admin Dashboard
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <LogoutButton />
            <Link
              href="/admin/articles/new"
              className="inline-flex items-center gap-2 bg-red-700 px-4 py-2 text-sm font-black uppercase text-white transition hover:bg-red-800"
            >
              <FaPlus aria-hidden="true" />
              New Article
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero Welcome */}
        <div className="mb-10 rounded-2xl bg-gradient-to-r from-neutral-950 to-neutral-800 px-6 py-10 text-white sm:px-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">
            VIDARBHA PRINT CMS
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Welcome back, Admin
          </h2>
          <p className="mt-2 max-w-xl text-sm font-medium text-neutral-400">
            Manage your newsroom — publish stories, track performance, and stay on top of breaking news.
          </p>
        </div>

        {/* Dashboard Overview */}
        <div className="mb-10">
          <h3 className="mb-5 text-sm font-black uppercase tracking-[0.16em] text-neutral-500">
            Dashboard Overview
          </h3>
          <DashboardStats />
        </div>

        {/* Recent Articles + Quick Actions */}
        <div className="mb-10 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-5 text-sm font-black uppercase tracking-[0.16em] text-neutral-500">
              Recent Articles
            </h3>
            <RecentArticles />
          </div>
          <div>
            <h3 className="mb-5 text-sm font-black uppercase tracking-[0.16em] text-neutral-500">
              Quick Actions
            </h3>
            <QuickActions />
          </div>
        </div>

        {/* Articles Table */}
        <div className="mb-10">
          <ArticlesTable />
        </div>
      </section>
    </main>
  );
}
