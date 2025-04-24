/**
 * Gemini API Types
 * 
 * Defines the interface for interacting with Google's Gemini AI API.
 * These types represent the parameters used for content generation.
 */

/**
 * Parameters for generating content with the Gemini AI API
 */
export interface GenerateContentParams {
  /** The name of the Gemini model to use (e.g., "gemini-2.0-flash") */
  modelName: string;
  
  /** The prompt text to send to the model for content generation */
  prompt: string;
  
  /** System instructions that define the model's behavior and context */
  systemInstruction: string;
  
  /** Controls randomness in the model output (0.0-1.0, lower is more deterministic) */
  temperature?: number;
  
  /** Maximum number of tokens the model should generate in its response */
  maxOutputTokens?: number;
} 