"use client";

import { useEffect, useState } from "react";
import { DashboardStatCard } from "./DashboardStatCard";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DashboardStats = {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  breakingArticles: number;
  featuredArticles: number;
  totalCategories: number;
  totalAuthors: number;
};

type DailyPublishCount = { date: string; count: number };
type CategoryCount = { category: string; count: number };
type StatusCount = { status: string; count: number };
type TopAuthor = { author: string; count: number };

type DashboardData = {
  stats: DashboardStats;
  dailyPublishCount: DailyPublishCount[];
  categoryCount: CategoryCount[];
  statusCount: StatusCount[];
  topAuthors: TopAuthor[];
};

type ApiResponse = {
  success: boolean;
  data?: DashboardData;
  error?: { message: string };
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATS = [
  { title: "Total Articles", key: "totalArticles" as const, icon: "📰", color: "bg-blue-50 text-blue-600" },
  { title: "Published", key: "publishedArticles" as const, icon: "✅", color: "bg-green-50 text-green-600" },
  { title: "Drafts", key: "draftArticles" as const, icon: "📝", color: "bg-yellow-50 text-yellow-600" },
  { title: "Breaking", key: "breakingArticles" as const, icon: "⚡", color: "bg-red-50 text-red-600" },
  { title: "Featured", key: "featuredArticles" as const, icon: "⭐", color: "bg-purple-50 text-purple-600" },
  { title: "Categories", key: "totalCategories" as const, icon: "📂", color: "bg-teal-50 text-teal-600" },
  { title: "Authors", key: "totalAuthors" as const, icon: "👤", color: "bg-indigo-50 text-indigo-600" },
];

const STATUS_COLORS = ["#10b981", "#f59e0b"];
const CHART_HEIGHT = 280;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DashboardStats() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        return res.json();
      })
      .then((json: ApiResponse) => {
        if (cancelled) return;

        if (!json.success || !json.data) {
          throw new Error(json.error?.message || "Unexpected response");
        }

        setData(json.data);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[DashboardStats]", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm font-semibold text-red-700">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-10">
      {/* ── Stat cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {STATS.map((s) => (
          <DashboardStatCard
            key={s.key}
            title={s.title}
            value={data.stats[s.key]}
            icon={s.icon}
            color={s.color}
          />
        ))}
      </div>

      {/* ── Charts grid ────────────────────────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Daily publishing trend */}
        <ChartCard title="Articles Published (Last 30 Days)">
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <LineChart data={data.dailyPublishCount}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(val) => val.slice(5)}
                stroke="#9ca3af"
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                labelStyle={{ color: "#111827" }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#dc2626"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Articles by category */}
        <ChartCard title="Articles by Category">
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={data.categoryCount}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 11 }}
                stroke="#9ca3af"
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey="count" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Articles by status */}
        <ChartCard title="Articles by Status">
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <PieChart>
              <Pie
                data={data.statusCount}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {data.statusCount.map((_entry, index) => (
                  <Cell
                    key={index}
                    fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top authors */}
        <ChartCard title="Top Authors">
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={data.topAuthors} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis
                type="category"
                dataKey="author"
                tick={{ fontSize: 11 }}
                width={120}
                stroke="#9ca3af"
              />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-black uppercase tracking-[0.12em] text-neutral-500">
        {title}
      </h3>
      {children}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-10">
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {STATS.map((s) => (
          <div
            key={s.key}
            className="rounded-xl bg-white p-6 shadow-sm animate-pulse"
          >
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-lg bg-neutral-200" />
              <div className="space-y-2">
                <div className="h-4 w-20 rounded bg-neutral-200" />
                <div className="h-8 w-12 rounded bg-neutral-200" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid gap-8 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm animate-pulse"
          >
            <div className="mb-4 h-4 w-48 rounded bg-neutral-200" />
            <div className="h-[280px] rounded bg-neutral-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
