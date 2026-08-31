import { GoogleGenerativeAI } from "@google/generative-ai";

let cachedModel: ReturnType<GoogleGenerativeAI["getGenerativeModel"]> | null = null;

function getModel() {
  if (cachedModel) return cachedModel;

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  cachedModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  return cachedModel;
}

export async function generateText(prompt: string): Promise<string> {
  const model = getModel();
  const result = await model.generateContent(prompt);

  return result.response.text();
}