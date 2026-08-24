import { NextRequest, NextResponse } from "next/server";
import { generateArticle } from "@/services/ai/articleGenerator";
import { requireAdmin } from "@/lib/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { validate } from "@/lib/validation/shared";
import { generateArticleSchema } from "@/lib/validation/generate-article";

// ---------------------------------------------------------------------------
// Types — Application DTO
// ---------------------------------------------------------------------------

/**
 * Official response contract for article generation.
 *
 * This is the ONLY shape the frontend ever sees. The API layer owns
 * the mapping from Gemini's raw output → this DTO.
 */
type GeneratedArticleDto = {
  headline: string;
  summary: string;
  body: string;
  category: string;
};

type GenerateArticleResponse =
  | { success: true; article: GeneratedArticleDto }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// POST /api/generate-article
// ---------------------------------------------------------------------------

/**
 * Generate an article draft using Gemini.
 *
 * Flow:
 *   1. Validate request body (prompt present)
 *   2. Call Gemini service → { title, summary, content }
 *   3. Validate Gemini output (all required fields present)
 *   4. Transform → GeneratedArticleDto { headline, summary, body, category }
 *   5. Return JSON (success or structured error)
 *
 * Every execution path returns a valid JSON response.
 */
export async function POST(req: NextRequest) {
  // Authentication: only admin users can generate articles.
  await requireAdmin();

  // Rate limit: 5 requests/minute/IP
  const rateLimitResult = await checkRateLimit(req, "generate-article");
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    // 1. Validate request body using Zod schema
    const body = await req.json();
    const data = validate(generateArticleSchema, body);

    // 2. Generate article (may throw on invalid Gemini JSON / network error)
    const raw = await generateArticle(data.prompt);

    // 3. Validate Gemini output — all three fields must exist and be non-empty
    if (
      !raw.title ||
      typeof raw.title !== "string" ||
      !raw.summary ||
      typeof raw.summary !== "string" ||
      !raw.content ||
      typeof raw.content !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "AI response was incomplete. Please try again or write manually.",
        },
        { status: 500 }
      );
    }

    // 4. Transform Gemini shape → frontend contract shape
    const article: GeneratedArticleDto = {
      headline: raw.title,
      summary: raw.summary,
      body: raw.content,
      category: "India",
    };

    // 5. Return structured success response
    return NextResponse.json({ success: true, article } satisfies GenerateArticleResponse);
  } catch (err: unknown) {
    // 6. Catch-all — never falls through to HTML
    const message = err instanceof Error ? err.message : "Generation failed.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}