/**
 * Gemini AI Service
 * 
 * Provides functionality to generate content using Google's Gemini AI models.
 * This service is used for analyzing blockchain metric data and generating insights.
 */
import { GoogleGenAI } from "@google/genai";
import type { GenerateContentParams } from "../types/gemini.ts";

// Get the API key from environment variables
const geminiApiKey = process.env.GEMINI_API_KEY;

// Validate that the API key is available
if (!geminiApiKey) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

// Initialize the Gemini client with the API key
const genAI = new GoogleGenAI({
  apiKey: geminiApiKey
});

/**
 * Generates content using Gemini AI model
 * 
 * @param options - Configuration options for content generation
 * @param options.modelName - Name of the Gemini model to use
 * @param options.prompt - The prompt text to send to the model
 * @param options.systemInstruction - System instruction for model context
 * @param options.temperature - Controls randomness (default: 0.1)
 * @param options.maxOutputTokens - Maximum tokens to generate (default: 1000)
 * @returns Promise resolving to the generated text or null on error
 */
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
