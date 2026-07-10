import { SafeLLMClient } from "@/lib/llm/SafeLLMClient";
import { z } from "zod";
import { AIPromptManager } from "./AIPromptManager";

export class WeakTopicCoach {
  public static async generateStudyPlan(analytics: any): Promise<any> {
    const schema = z.object({
      summary: z.string(),
      weakTopics: z.array(z.object({
        topic: z.string(),
        reason: z.string(),
        priority: z.enum(['High', 'Medium', 'Low'])
      })),
      dailyPlan: z.array(z.string()),
      recommendedMockType: z.string().optional()
    });

    const messages = AIPromptManager.getWeakTopicCoachPrompt(analytics);
    return await SafeLLMClient.generateStructuredJSON(messages, schema);
  }
}
