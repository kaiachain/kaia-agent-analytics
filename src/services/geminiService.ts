import { GoogleGenAI } from "@google/genai";
import type { GenerateContentParams } from "../types/gemini.ts";

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenAI({
  apiKey: geminiApiKey
});

async function generateContent({
  modelName,
  prompt,
  systemInstruction,
  temperature = 0.1,
  maxOutputTokens = 1000,
}: GenerateContentParams): Promise<string | null> {
  const response = await genAI.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      temperature: temperature,
      maxOutputTokens: maxOutputTokens,
    },
  });

  return response.text ?? null;
}

export default generateContent;
