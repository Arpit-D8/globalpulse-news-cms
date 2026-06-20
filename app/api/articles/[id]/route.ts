import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import ArticleModel from "@/models/Article";
import {
  buildArticlePayload,
  getArticleById,
  serializeArticle,
} from "@/lib/articles";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { connectDB } from "@/lib/mongodb";
import type { Article, ArticleMutationInput } from "@/lib/types";
import type { SerializedArticleSource } from "@/lib/articles";

export const dynamic = "force-dynamic";

type ArticleRouteContext = {
  params: Promise<{ id: string }>;
};

function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function revalidateArticle(article?: Article | null) {
  revalidatePath("/");
  revalidatePath("/admin");

  if (!article) {
    return;
  }

  revalidatePath(`/articles/${article.slug}`);
  revalidatePath(`/category/${CATEGORY_CONFIG[article.category].slug}`);
}

export async function GET(
  _request: NextRequest,
  { params }: ArticleRouteContext
) {
  const { id } = await params;
  const article = await getArticleById(id);

  if (!article) {
    return apiError("Article not found.", 404);
  }

  return NextResponse.json({ article });
}

export async function PUT(request: NextRequest, { params }: ArticleRouteContext) {
  const { id } = await params;
  const existing = await getArticleById(id);

  if (!existing) {
    return apiError("Article not found.", 404);
  }

  await connectDB();

  try {
    const body = (await request.json()) as ArticleMutationInput;
    const { payload, errors } = await buildArticlePayload(body, existing);

    if (!payload) {
      return apiError(errors.join(" "));
    }

    const updated = await ArticleModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).lean<SerializedArticleSource | null>();

    if (!updated) {
      return apiError("Article not found.", 404);
    }

    const serialized = serializeArticle(updated);

    revalidateArticle(existing);
    revalidateArticle(serialized);

    return NextResponse.json({ article: serialized });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update article.";
    return apiError(message, 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: ArticleRouteContext
) {
  const { id } = await params;
  const existing = await getArticleById(id);

  if (!existing) {
    return apiError("Article not found.", 404);
  }

  await connectDB();
  await ArticleModel.findByIdAndDelete(id);
  revalidateArticle(existing);

  return NextResponse.json({ ok: true });
}
