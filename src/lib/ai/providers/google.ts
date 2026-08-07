import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider, AIProviderResponse } from "../types";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const GoogleProvider: AIProvider = {
  name: "Google Gemini",
  generateJSON: async (prompt: string, modelType = 'reasoning'): Promise<AIProviderResponse> => {
    const startTime = Date.now();
    try {
      const modelName = modelType === 'fast' ? "gemini-1.5-flash" : "gemini-1.5-pro";
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent(prompt);
      let text = result.response.text();
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsed = JSON.parse(text);
      return {
        success: true,
        data: parsed,
        metadata: {
          model: modelName,
          latencyMs: Date.now() - startTime
        }
      };
    } catch (e: any) {
      console.error("GoogleProvider generateJSON error:", e);
      return {
        success: false,
        error: e.message,
        metadata: {
          model: "unknown",
          latencyMs: Date.now() - startTime
        }
      };
    }
  },
  generateText: async (prompt: string, modelType = 'fast'): Promise<AIProviderResponse> => {
    const startTime = Date.now();
    try {
      const modelName = modelType === 'fast' ? "gemini-1.5-flash" : "gemini-1.5-pro";
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      
      return {
        success: true,
        data: text,
        metadata: {
          model: modelName,
          latencyMs: Date.now() - startTime
        }
      };
    } catch (e: any) {
      console.error("GoogleProvider generateText error:", e);
      return {
        success: false,
        error: e.message,
        metadata: {
          model: "unknown",
          latencyMs: Date.now() - startTime
        }
      };
    }
  }
};
