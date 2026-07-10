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
    const res = await SafeLLMClient.generateStructuredJSON(messages, schema);
    return res as QuizConfig;
  }
}
