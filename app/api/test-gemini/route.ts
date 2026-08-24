import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET() {
  await requireAdmin();
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY missing" },
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
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}