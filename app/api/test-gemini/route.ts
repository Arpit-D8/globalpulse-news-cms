import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
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

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Write one professional news headline about AI.",
    });

    return NextResponse.json({
      success: true,
      text: response.text,
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}