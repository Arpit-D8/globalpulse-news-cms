import { NextResponse } from "next/server";
import { NewsAPIProvider, NewsManager } from "@/services/ai/news";
import { requireAdmin } from "@/lib/auth-guard";
import { AppError } from "@/lib/errors";

// Disable test endpoints in production
const isProduction =
  process.env.VERCEL_ENV === "production" ||
  process.env.NODE_ENV === "production" ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

export async function GET() {
  if (isProduction) {
    return NextResponse.json(
      { success: false, error: "Test endpoints are disabled in production" },
      { status: 501 }
    );
  }

  try {
    await requireAdmin();

    const manager = new NewsManager([
      new NewsAPIProvider(),
    ]);

    const articles = await manager.fetchAllNews();

    return NextResponse.json({
      success: true,
      count: articles.length,
      articles,
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}