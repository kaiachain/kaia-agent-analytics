export interface GenerateContentParams {
  modelName: string;
  prompt: string;
  systemInstruction: string;
  temperature?: number;
  maxOutputTokens?: number;
} 