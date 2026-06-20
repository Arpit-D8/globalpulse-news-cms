import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import ArticleModel from "@/models/Article";
import {
  buildArticlePayload,
  getAdminArticles,
  getPublishedArticles,
  serializeArticle,
} from "@/lib/articles";
import { CATEGORY_CONFIG, getCategoryFromSlug } from "@/lib/constants";
import { connectDB } from "@/lib/mongodb";
import type { ArticleMutationInput } from "@/lib/types";
import type { SerializedArticleSource } from "@/lib/articles";

export const dynamic = "force-dynamic";

function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function revalidateArticleLists(categorySlug?: string) {
  revalidatePath("/");
  revalidatePath("/admin");

  if (categorySlug) {
    revalidatePath(`/category/${categorySlug}`);
  }
}

export async function GET(request: NextRequest) {
  const categorySlug = request.nextUrl.searchParams.get("category");
  const status = request.nextUrl.searchParams.get("status");
  const category = categorySlug ? getCategoryFromSlug(categorySlug) : undefined;

  if (categorySlug && !category) {
    return apiError("Invalid category.");
  }

  const articles =
    status === "all"
      ? await getAdminArticles()
      : await getPublishedArticles({ category, limit: 100 });

  return NextResponse.json({ articles });
}

export async function POST(request: NextRequest) {
  await connectDB();

  try {
    const body = (await request.json()) as ArticleMutationInput;
    const { payload, errors } = await buildArticlePayload(body);

    if (!payload) {
      return apiError(errors.join(" "));
    }

    const article = await ArticleModel.create(payload);
    const serialized = serializeArticle(
      article.toObject() as SerializedArticleSource
    );

    revalidateArticleLists(CATEGORY_CONFIG[serialized.category].slug);

    return NextResponse.json({ article: serialized }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create article.";
    return apiError(message, 500);
  }
}
