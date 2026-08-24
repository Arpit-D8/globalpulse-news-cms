import { connectDB } from "@/lib/mongodb";
import Article from "@/models/Article";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DashboardStats = {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  breakingArticles: number;
  featuredArticles: number;
  totalCategories: number;
  totalAuthors: number;
};

export type DailyPublishCount = {
  date: string;
  count: number;
};

export type CategoryCount = {
  category: string;
  count: number;
};

export type StatusCount = {
  status: string;
  count: number;
};

export type TopAuthor = {
  author: string;
  count: number;
};

export type DashboardAnalytics = {
  stats: DashboardStats;
  dailyPublishCount: DailyPublishCount[];
  categoryCount: CategoryCount[];
  statusCount: StatusCount[];
  topAuthors: TopAuthor[];
};

// ---------------------------------------------------------------------------
// Dashboard statistics
// ---------------------------------------------------------------------------

/**
 * Retrieve dashboard statistics from MongoDB.
 *
 * Uses a single aggregation pipeline to compute all counts in one pass,
 * reducing database round trips from 8 to 1.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  await connectDB();

  const [aggregationResult, distinctCategories, distinctAuthors] =
    await Promise.all([
      Article.aggregate([
        {
          $group: {
            _id: null,
            totalArticles: { $sum: 1 },
            publishedArticles: {
              $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
            },
            draftArticles: {
              $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] },
            },
            breakingArticles: {
              $sum: { $cond: ["$isBreaking", 1, 0] },
            },
            featuredArticles: {
              $sum: { $cond: ["$isFeatured", 1, 0] },
            },
          },
        },
      ]),
      Article.distinct("category"),
      Article.distinct("author"),
    ]);

  const stats = aggregationResult[0] || {
    totalArticles: 0,
    publishedArticles: 0,
    draftArticles: 0,
    breakingArticles: 0,
    featuredArticles: 0,
  };

  return {
    totalArticles: stats.totalArticles,
    publishedArticles: stats.publishedArticles,
    draftArticles: stats.draftArticles,
    breakingArticles: stats.breakingArticles,
    featuredArticles: stats.featuredArticles,
    totalCategories: distinctCategories.length,
    totalAuthors: distinctAuthors.length,
  };
}

// ---------------------------------------------------------------------------
// Aggregation helpers
// ---------------------------------------------------------------------------

/**
 * Articles published per day over the last 30 days.
 *
 * Uses $dateToString to bucket by calendar day, then sorts chronologically.
 */
async function getDailyPublishCount(): Promise<DailyPublishCount[]> {
  await connectDB();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const results = (await Article.aggregate([
    {
      $match: {
        publishedAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$publishedAt" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ])) as { _id: string; count: number }[];

  return results.map((row) => ({
    date: row._id,
    count: row.count,
  }));
}

/**
 * Article count grouped by category.
 */
async function getCategoryCount(): Promise<CategoryCount[]> {
  await connectDB();

  const results = (await Article.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ])) as { _id: string; count: number }[];

  return results.map((row) => ({
    category: row._id,
    count: row.count,
  }));
}

/**
 * Article count grouped by status.
 */
async function getStatusCount(): Promise<StatusCount[]> {
  await connectDB();

  const results = (await Article.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ])) as { _id: string; count: number }[];

  return results.map((row) => ({
    status: row._id,
    count: row.count,
  }));
}

/**
 * Top authors ranked by article count (top 5).
 */
async function getTopAuthors(): Promise<TopAuthor[]> {
  await connectDB();

  const results = (await Article.aggregate([
    {
      $group: {
        _id: "$author",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 5,
    },
  ])) as { _id: string; count: number }[];

  return results.map((row) => ({
    author: row._id,
    count: row.count,
  }));
}

// ---------------------------------------------------------------------------
// Dashboard analytics (combined)
// ---------------------------------------------------------------------------

/**
 * Retrieve full dashboard analytics including statistics and aggregations.
 */
export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  const [stats, dailyPublishCount, categoryCount, statusCount, topAuthors] =
    await Promise.all([
      getDashboardStats(),
      getDailyPublishCount(),
      getCategoryCount(),
      getStatusCount(),
      getTopAuthors(),
    ]);

  return {
    stats,
    dailyPublishCount,
    categoryCount,
    statusCount,
    topAuthors,
  };
}

/**
 * Retrieve recent articles sorted by last updated.
 *
 * Uses lean + projection to load only the fields needed for dashboard display,
 * reducing memory footprint and network transfer. Populates featuredImage so
 * the URL is available for image rendering.
 */
export async function getRecentArticles(limit = 5) {
  await connectDB();

  const articles = await Article.find()
    .sort({ updatedAt: -1 })
    .limit(limit)
    .select("_id title slug summary status publishedAt updatedAt featuredImage")
    .populate("featuredImage")
    .lean();

  // Serialize featuredImage URL from populated Media doc.
  return articles.map((article) => {
    const articleObj = article as Record<string, unknown>;
    const featuredImage = articleObj.featuredImage;
    const image = featuredImage
      ? String(((featuredImage as Record<string, unknown>).url ?? ""))
      : "";
    return {
      ...article,
      image,
      featuredImage: undefined, // avoid leaking ObjectId into response
    };
  });
}
