import { NextResponse } from "next/server";
import { NewsAPIProvider, NewsManager } from "@/services/ai/news";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET() {
  await requireAdmin();
  try {
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
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status: 500,
      }
    );
  }
}