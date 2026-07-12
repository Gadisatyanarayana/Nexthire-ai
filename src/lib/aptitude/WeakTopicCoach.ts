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
      recommendedMockType: z.string().optional(),
      recommendedRoute: z.string().optional()
    });

    const messages = AIPromptManager.getWeakTopicCoachPrompt(analytics);
    let plan;
    try {
      plan = await SafeLLMClient.generateStructuredJSON(messages, schema);
    } catch (error) {
      console.warn("[WeakTopicCoach] AI generation failed, using fallback.", error);
      plan = {
        summary: "Focus on your lowest scoring topics and attempt a custom mock test.",
        weakTopics: [],
        dailyPlan: ["Review weak formulas", "Take a custom practice quiz", "Analyze mistakes"],
        recommendedMockType: "custom"
      };
    }

    // Ensure recommendedRoute exists based on analytics if LLM didn't provide one
    if (!plan.recommendedRoute) {
      if (analytics?.mastery && analytics.mastery.length > 0) {
        const sorted = [...analytics.mastery].sort((a, b) => (a.mastery_score || 0) - (b.mastery_score || 0));
        const weakest = sorted[0];
        if (weakest.mastery_score < 80) {
          plan.recommendedRoute = `/aptitude/practice/${weakest.topic_id}`;
        }
      }
      if (!plan.recommendedRoute) {
        plan.recommendedRoute = "/aptitude/practice"; // Fallback to general practice
      }
    }

    return plan;
  }
}
