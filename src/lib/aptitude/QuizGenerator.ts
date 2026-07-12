import { SafeLLMClient } from "@/lib/llm/SafeLLMClient";
import { z } from "zod";
import { AIPromptManager } from "./AIPromptManager";

export interface QuizConfig {
  numQuestions: number;
  topics: string[];
  difficultyDistribution: { easy: number, medium: number, hard: number };
  companyTags?: string[];
  focus: "revision" | "weak_topics" | "company" | "mixed";
}

export class QuizGenerator {
  public static async generateQuizConfig(analytics: any, preference: any): Promise<QuizConfig> {
    const schema = z.object({
      numQuestions: z.number(),
      topics: z.array(z.string()),
      difficultyDistribution: z.object({ easy: z.number(), medium: z.number(), hard: z.number() }),
      companyTags: z.array(z.string()).optional(),
      focus: z.enum(["revision", "weak_topics", "company", "mixed"])
    });

    const messages = AIPromptManager.getQuizGeneratorPrompt(analytics, preference);
    
    try {
      const res = await SafeLLMClient.generateStructuredJSON(messages, schema);
      return res as QuizConfig;
    } catch (error) {
      console.warn("[QuizGenerator] AI generation failed, using fallback config.", error);
      
      // Attempt to extract weak topics from analytics to avoid an empty quiz
      let fallbackTopics: string[] = [];
      if (analytics && analytics.mastery && Array.isArray(analytics.mastery)) {
        fallbackTopics = analytics.mastery
          .filter((m: any) => m.mastery_score < 70)
          .map((m: any) => m.topic_id)
          .slice(0, 3);
      }

      return {
        numQuestions: 10,
        topics: fallbackTopics,
        difficultyDistribution: { easy: 0.4, medium: 0.4, hard: 0.2 },
        focus: "mixed"
      };
    }
  }
}
