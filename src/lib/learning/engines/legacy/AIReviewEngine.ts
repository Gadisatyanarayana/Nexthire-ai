import { SafeLLMClient } from "@/lib/llm/SafeLLMClient";
import { z } from "zod";
import { AIPromptManager } from "./AIPromptManager";

export class AIReviewEngine {
  public static async generateSessionReview(sessionData: any): Promise<any> {
    const schema = z.object({
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
      suggestions: z.array(z.string()),
      recommendedLessons: z.array(z.string()),
      timeManagement: z.string()
    });

    const messages = AIPromptManager.getReviewEnginePrompt(sessionData);
    return await SafeLLMClient.generateStructuredJSON(messages, schema);
  }
}
