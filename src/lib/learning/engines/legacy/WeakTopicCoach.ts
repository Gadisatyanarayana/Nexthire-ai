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
      let extractedWeakTopics: any[] = [];
      if (analytics?.mastery && Array.isArray(analytics.mastery)) {
        extractedWeakTopics = analytics.mastery
          .filter((m: any) => (m.mastery_score || 0) < 75)
          .map((m: any) => ({
            topic: m.topic_id || "Quantitative Fundamentals",
            reason: `Accuracy is at ${Math.round(m.mastery_score || 50)}%. Needs practice on core shortcuts.`,
            priority: (m.mastery_score || 0) < 50 ? "High" : "Medium"
          })).slice(0, 3);
      }

      if (extractedWeakTopics.length === 0) {
        extractedWeakTopics = [
          { topic: "Percentages & Applications", reason: "Fundamental concept required for Data Interpretation", priority: "High" },
          { topic: "Data Interpretation (Tables)", reason: "High weightage in TCS NQT & Infosys tests", priority: "High" },
          { topic: "Seating Arrangement & Puzzles", reason: "Improves analytical speed and accuracy", priority: "Medium" }
        ];
      }

      plan = {
        summary: "Target your lowest scoring topics and complete recommended practice modules.",
        weakTopics: extractedWeakTopics,
        dailyPlan: [
          "Day 1: Review formulas & core shortcuts for weak topics",
          "Day 2: Solve 20 high-frequency practice questions",
          "Day 3: Take a timed company pattern mock test"
        ],
        recommendedMockType: "custom",
        recommendedRoute: "/aptitude/practice"
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
