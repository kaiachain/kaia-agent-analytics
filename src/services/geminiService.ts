/**
 * Gemini AI Service
 * 
 * Provides functionality to generate content using Google's Gemini AI models.
 * This service is used for analyzing blockchain metric data and generating insights.
 */
import { GoogleGenAI } from "@google/genai";
import type { GenerateContentParams } from "../types";
import { logger, asyncErrorHandler } from "../utils";

// Get the API key from environment variables
const geminiApiKey = process.env.GEMINI_API_KEY;

// Validate that the API key is available
if (!geminiApiKey) {
  const error = new Error("GEMINI_API_KEY environment variable is not set.");
  logger.error(error.message);
  throw error;
}

// Initialize the Gemini client with the API key
const genAI = new GoogleGenAI({
  apiKey: geminiApiKey
});

logger.debug('Gemini AI client initialized', {
  apiKeyProvided: !!geminiApiKey,
  apiKeyLength: geminiApiKey?.length || 0
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
const generateContent = asyncErrorHandler(async ({
  modelName,
  prompt,
  systemInstruction,
  temperature = 0.0,
  maxOutputTokens = 10000,
}: GenerateContentParams): Promise<string | null> => {
  logger.info(`Generating content with Gemini model: ${modelName}`, {
    temperature,
    maxOutputTokens,
    promptLength: prompt.length,
  });
  
  logger.debug('Detailed Gemini request parameters', {
    modelName,
    temperature,
    maxOutputTokens,
    promptLength: prompt.length,
    systemInstructionLength: systemInstruction.length,
    firstPromptChars: prompt.substring(0, 100) + '...'
  });
  
  const startTime = Date.now();
  const response = await genAI.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      temperature: temperature,
      maxOutputTokens: maxOutputTokens,
    },
  });
  const requestTime = Date.now() - startTime;
  
  const responseText = response.text ?? null;
  
  logger.debug('Gemini response details', {
    requestTime: `${requestTime}ms`,
    responseLength: responseText?.length || 0,
    hasResponse: !!responseText,
    responsePreview: responseText ? responseText.substring(0, 100) + '...' : 'No response'
  });

  return responseText;

}, "Gemini Service");

export default generateContent;
