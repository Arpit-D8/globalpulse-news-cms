import { generateText } from "./gemini";

export interface GeneratedArticle {
  title: string;
  summary: string;
  content: string;
}

export async function generateArticle(
  topic: string
): Promise<GeneratedArticle> {
  const prompt = `
You are an experienced journalist.

Write a professional news article about:

${topic}

Return ONLY valid JSON.

{
"title":"",
"summary":"",
"content":""
}

Requirements:

- Original writing
- Neutral tone
- No markdown
- No code fences
- Summary under 60 words
- 600-900 words
`;

  const response = await generateText(prompt);

  // Strip Markdown code fences (```json ... ```) and surrounding whitespace
  // that Gemini sometimes wraps around the JSON output.
  const cleaned = response
    .replace(/^```json\s*/i, "")
    .replace(/\s*```$/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error("Gemini returned invalid JSON.");
  }
}